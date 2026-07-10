import { monthKey, monthLabel } from '../months'

// Playlists come from the hand-maintained Playlists sheet tab: one row per
// month (YYYY-MM) plus an "all" row for the master playlist of every song.

// Sheets sometimes turns a typed "2026-07" into a real date, which the backend
// serializes as an ISO string — normalize either form to a month key.
function normalizeMonth(value) {
  const v = String(value || '').trim()
  if (v.toLowerCase() === 'all') return 'all'
  if (/^\d{4}-\d{2}$/.test(v)) return v
  return monthKey(v)
}

function safeUrl(value) {
  const v = String(value || '').trim()
  return /^https?:\/\//i.test(v) ? v : ''
}

export default function PlaylistLinks({ playlists, month }) {
  const entry = playlists.find((p) => normalizeMonth(p.month) === month)
  if (!entry) return null

  const links = [
    { label: 'Spotify', url: safeUrl(entry.spotifyUrl) },
    { label: 'Apple Music', url: safeUrl(entry.appleMusicUrl) },
  ].filter((l) => l.url)
  if (links.length === 0) return null

  return (
    <p className="playlist-links">
      🎧 {month === 'all' ? 'Master playlist' : `${monthLabel(month)} playlist`}:{' '}
      {links.map((l, i) => (
        <span key={l.label}>
          {i > 0 && ' · '}
          <a href={l.url} target="_blank" rel="noopener noreferrer">
            {l.label}
          </a>
        </span>
      ))}
    </p>
  )
}
