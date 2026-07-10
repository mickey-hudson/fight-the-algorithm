#!/usr/bin/env node
/**
 * One-time migration of the pre-app "Fight the Algorithm" monthly CSVs into
 * the new Google Sheet backend.
 *
 *   node scripts/migrate-legacy.mjs           # dry run: report + preview files
 *   node scripts/migrate-legacy.mjs --push    # POST to the Apps Script backend
 *
 * CSV shape (one file per month, "Fight the Algorithm - <Month> <Year>.csv"):
 *   Song, Artist, Genre, Recommended by DJ..., DJ Notes, Listener Notes, [more listener notes...]
 *
 * Attribution is messy — no validation in the old system — so users are
 * resolved in three steps:
 *   0. legacy-data/overrides.json  ({ "raw string": "Exact Alias" })
 *   1. fuzzy token match against alias parts (ignoring "DJ")
 *   2. fuzzy token match against first/last names
 * Unmatched or ambiguous strings land in legacy-data/out/unmatched-report.md,
 * bucketed by month, with ready-to-paste override keys.
 *
 * Listener notes become comments; each note's trailing "- DJ Whoever" is
 * parsed for attribution and stripped from the comment text.
 *
 * Ids are deterministic (md5 of month+row), so re-pushing never duplicates:
 * the backend importLegacy action skips ids it has already seen.
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const LEGACY_DIR = path.join(ROOT, 'legacy-data')
const OUT_DIR = path.join(LEGACY_DIR, 'out')
const OVERRIDES_PATH = path.join(LEGACY_DIR, 'overrides.json')
const PUSH = process.argv.includes('--push')

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
]

// --- CSV parsing (RFC 4180: quoted fields may contain commas, quotes, newlines) ---

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      field = ''
      rows.push(row)
      row = []
    } else {
      field += ch
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''))
}

// --- User matching ---

// Articles/fragments that ruin exact-matching (e.g. the "a" and "I" in
// "DJ I Don't Want a DJ Name" would tie with any string containing them).
const STOPWORDS = new Set(['dj', 'a', 'i', 't', 'the', 'and'])

function tokens(value) {
  return String(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t && !STOPWORDS.has(t))
}

// "DJOT" → DJ Older Twin, "DJ KN" → DJ Knitting Needles, "DJIDWADN" → Jocelyn.
// Compare the raw string (squashed, optional leading "dj" removed) against the
// alias's word-initials, computed with and without the alias's own "DJ" words.
function initialsVariants(alias) {
  const words = alias.toLowerCase().split(/\s+/).map((w) => w.replace(/[^a-z0-9']/g, ''))
    .filter(Boolean)
  // A leading "DJ" is a title people drop, but an inner "DJ" (as in
  // "DJ I Don't Want a DJ Name" → IDWADN / IDWADJN) is part of the initialism.
  const core = words[0] === 'dj' ? words.slice(1) : words
  return new Set([
    words.map((w) => w[0]).join(''),
    core.map((w) => w[0]).join(''),
    core.map((w) => (w === 'dj' ? 'dj' : w[0])).join(''),
  ])
}

function matchesInitials(raw, alias) {
  const squashed = String(raw).toLowerCase().replace(/[^a-z0-9]/g, '')
  const forms = new Set([squashed, squashed.replace(/^dj/, '')])
  const variants = initialsVariants(alias)
  for (const f of forms) {
    if (f.length >= 2 && variants.has(f)) return true
  }
  return false
}

function tokenMatches(t, candidates) {
  return candidates.some((c) => {
    // Fuzzy rules only between meaty tokens; tiny ones ("i", "a", "b") must be exact,
    // otherwise "midge".includes("i") ties everyone with "DJ I Don't Want a DJ Name".
    if (t.length < 3 || c.length < 3) return t === c
    if (c.includes(t) || t.includes(c)) return true
    let shared = 0
    while (shared < Math.min(t.length, c.length) && t[shared] === c[shared]) shared++
    return shared >= 3
  })
}

// Score raw string against each user's candidate tokens; a unique best scorer
// wins, ties are ambiguous (reported rather than guessed).
function scoreMatch(raw, users, candidatesOf) {
  const rawTokens = tokens(raw)
  if (rawTokens.length === 0) return { user: null, reason: 'empty' }
  let best = null
  let bestScore = 0
  let tied = false
  for (const user of users) {
    const candidates = candidatesOf(user)
    if (candidates.length === 0) continue
    const score = rawTokens.filter((t) => tokenMatches(t, candidates)).length
    if (score > bestScore) {
      best = user
      bestScore = score
      tied = false
    } else if (score === bestScore && score > 0 && user !== best) {
      tied = true
    }
  }
  if (bestScore === 0) return { user: null, reason: 'no match' }
  if (tied) return { user: null, reason: 'ambiguous' }
  return { user: best }
}

function resolveUser(raw, users, overrides) {
  const trimmed = raw.trim()
  if (!trimmed) return { user: null, reason: 'empty' }

  // A key's presence in overrides is authoritative: an empty value means
  // "needs a human decision" and must never fall through to fuzzy matching
  // (that's how "her husband" would otherwise substring-match a surname).
  if (Object.prototype.hasOwnProperty.call(overrides, trimmed)) {
    const overrideAlias = overrides[trimmed]
    if (!overrideAlias) return { user: null, reason: 'override pending (empty value in overrides.json)' }
    const user = users.find((u) => u.alias.toLowerCase() === overrideAlias.toLowerCase())
    if (user) return { user, via: 'override' }
    return { user: null, reason: `override alias "${overrideAlias}" not found in Users` }
  }

  const pass1 = scoreMatch(trimmed, users, (u) => tokens(u.alias))
  if (pass1.user) return { user: pass1.user, via: 'alias' }

  const byInitials = users.filter((u) => matchesInitials(trimmed, u.alias))
  if (byInitials.length === 1) return { user: byInitials[0], via: 'initials' }

  const pass2 = scoreMatch(trimmed, users, (u) => tokens(`${u.firstName} ${u.lastName}`))
  if (pass2.user) return { user: pass2.user, via: 'name' }

  return { user: null, reason: pass1.reason === 'ambiguous' || pass2.reason === 'ambiguous' ? 'ambiguous' : 'no match' }
}

// --- Listener note attribution: strip a trailing "- DJ Whoever" ---

function splitAttribution(note) {
  const trimmed = note.trim()
  // last dash/tilde separator whose tail looks like a short name
  const m = trimmed.match(/^(.*?)(?:\s*[-–—~]+\s*)([^-–—~]{1,45})$/s)
  if (m) {
    const candidate = m[2].trim().replace(/[.,!?\s]+$/, '')
    if (candidate && tokens(candidate).length > 0 && tokens(candidate).length <= 6) {
      return { text: m[1].trim(), attribution: candidate }
    }
  }
  return { text: trimmed, attribution: null }
}

// --- Deterministic ids so --push is idempotent ---

function legacyId(...parts) {
  const hex = createHash('md5').update('fta-legacy|' + parts.join('|')).digest('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

// --- Main ---

const configSource = readFileSync(path.join(ROOT, 'src/config.js'), 'utf8')
const urlMatch = configSource.match(/APPS_SCRIPT_URL\s*=\s*\n?\s*["']([^"']+)["']/)
if (!urlMatch) {
  console.error('Could not read APPS_SCRIPT_URL from src/config.js')
  process.exit(1)
}
const APPS_SCRIPT_URL = urlMatch[1]

const overrides = existsSync(OVERRIDES_PATH)
  ? JSON.parse(readFileSync(OVERRIDES_PATH, 'utf8'))
  : {}

console.log(`Fetching users from backend…`)
const live = await (await fetch(APPS_SCRIPT_URL)).json()
if (live.error) throw new Error(live.error)
const users = live.users
console.log(`  ${users.length} users, ${live.songs.length} existing songs\n`)

const files = readdirSync(LEGACY_DIR)
  .filter((f) => f.endsWith('.csv'))
  .map((f) => {
    const m = f.match(/-\s*([A-Za-z]+)\s+(\d{4})\.csv$/)
    if (!m) throw new Error(`Cannot parse month/year from filename: ${f}`)
    const monthIndex = MONTHS.indexOf(m[1].toLowerCase())
    if (monthIndex === -1) throw new Error(`Unknown month in filename: ${f}`)
    return { file: f, year: Number(m[2]), monthIndex }
  })
  .sort((a, b) => a.year - b.year || a.monthIndex - b.monthIndex)

const songs = []
const comments = []
const unmatched = [] // { month, kind, raw, context, reason }
const matchLog = []

for (const { file, year, monthIndex } of files) {
  const monthLabel = `${year}-${String(monthIndex + 1).padStart(2, '0')}`
  const rows = parseCsv(readFileSync(path.join(LEGACY_DIR, file), 'utf8'))
  const [header, ...dataRows] = rows

  dataRows.forEach((row, r) => {
    const [song, artist, genre, recommender, djNotes, ...listenerCells] = row.map((c) => c.trim())
    if (!song && !artist) return

    const monthKey = `${monthLabel}|row${r}`
    const songId = legacyId('song', monthKey)
    const createdAt = new Date(Date.UTC(year, monthIndex, 1, 12, r)).toISOString()

    const rec = resolveUser(recommender, users, overrides)
    if (rec.user) {
      matchLog.push(`[${monthLabel}] song "${song}" — "${recommender}" → ${rec.user.alias} (${rec.via})`)
    } else {
      unmatched.push({
        month: monthLabel,
        kind: 'song recommender',
        raw: recommender,
        context: `"${song}" by ${artist}`,
        reason: rec.reason,
      })
    }

    songs.push({
      id: songId,
      song,
      artist,
      genre,
      userId: rec.user ? rec.user.id : '',
      notes: djNotes,
      createdAt,
      _raw: recommender,
    })

    listenerCells
      .filter((cell) => cell)
      .forEach((cell, n) => {
        const { text, attribution } = splitAttribution(cell)
        // No parseable attribution → only an explicit override (keyed by the full
        // text) may attribute it; fuzzy-matching whole comments would misfire on
        // people who are merely mentioned.
        const commenter = attribution
          ? resolveUser(attribution, users, overrides)
          : overrides[cell.trim()]
            ? resolveUser(cell.trim(), users, overrides)
            : { user: null, reason: 'no attribution found in text' }
        if (commenter.user) {
          matchLog.push(`[${monthLabel}] comment on "${song}" — "${attribution}" → ${commenter.user.alias} (${commenter.via})`)
        } else {
          unmatched.push({
            month: monthLabel,
            kind: 'comment',
            raw: attribution || cell,
            context: `on "${song}": ${cell.slice(0, 100)}`,
            reason: commenter.reason,
          })
        }
        comments.push({
          id: legacyId('comment', monthKey, n),
          songId,
          userId: commenter.user ? commenter.user.id : '',
          text: commenter.user ? text : cell, // keep full text until attribution is resolved
          createdAt: new Date(Date.UTC(year, monthIndex, 1, 13, r, n)).toISOString(),
        })
      })
  })
}

mkdirSync(OUT_DIR, { recursive: true })

// Unmatched report, bucketed by month
const byMonth = new Map()
for (const u of unmatched) {
  if (!byMonth.has(u.month)) byMonth.set(u.month, [])
  byMonth.get(u.month).push(u)
}
let report = `# Unmatched attributions (${unmatched.length})\n\n`
report += `Fix these by adding entries to \`legacy-data/overrides.json\` mapping the raw\nstring to the exact alias from the Users tab, e.g.\n\n`
report += '```json\n{\n  "DJOT": "DJ Older Twin"\n}\n```\n\n'
for (const [month, items] of [...byMonth.entries()].sort()) {
  report += `## ${month} (${items.length})\n\n`
  for (const u of items) {
    report += `- \`${JSON.stringify(u.raw)}\` — ${u.kind}, ${u.reason}\n  - ${u.context}\n`
  }
  report += '\n'
}
writeFileSync(path.join(OUT_DIR, 'unmatched-report.md'), report)
writeFileSync(path.join(OUT_DIR, 'songs.preview.json'), JSON.stringify(songs, null, 2))
writeFileSync(path.join(OUT_DIR, 'comments.preview.json'), JSON.stringify(comments, null, 2))
writeFileSync(path.join(OUT_DIR, 'match-log.txt'), matchLog.join('\n'))

console.log(`Parsed ${songs.length} songs and ${comments.length} comments from ${files.length} files.`)
console.log(`Matched: ${songs.filter((s) => s.userId).length}/${songs.length} songs, ${comments.filter((c) => c.userId).length}/${comments.length} comments.`)
console.log(`Unmatched: ${unmatched.length} → ${path.relative(ROOT, path.join(OUT_DIR, 'unmatched-report.md'))}`)
console.log(`Match decisions: ${path.relative(ROOT, path.join(OUT_DIR, 'match-log.txt'))}`)

if (!PUSH) {
  console.log('\nDry run only. Re-run with --push to import (requires zero unmatched).')
  process.exit(0)
}

if (unmatched.length > 0) {
  console.error(`\nRefusing to push with ${unmatched.length} unmatched attributions. Fill in overrides.json and re-run.`)
  process.exit(1)
}

console.log('\nPushing to backend…')
const res = await fetch(APPS_SCRIPT_URL, {
  method: 'POST',
  body: JSON.stringify({
    action: 'importLegacy',
    songs: songs.map(({ _raw, ...s }) => s),
    comments,
  }),
})
const result = await res.json()
if (result.error) throw new Error(result.error)
console.log('Backend result:', JSON.stringify(result, null, 2))
