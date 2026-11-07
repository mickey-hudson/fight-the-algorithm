// LOAF (Listener Obsessed, Absolute Fire): a badge people attach to a comment.
// Deliberately not a score — no counts, no sums, no rankings anywhere. The Loaf
// Log is just the feed of those moments, derived entirely from data the app
// already has — no backend involved.

import { monthKey } from './months'

// Badge flags arrive as booleans from the mock backend and as 'true'/'false'
// strings from the Sheets backend.
export function isFlagged(value) {
  return value === true || String(value).toLowerCase() === 'true'
}

// Loaf moments for the given crate ('all' = every crate), newest first.
// crateKey maps a song's createdAt to its crate — months by default, years on
// the holiday page (see editions.js).
export function loafLog(songs, comments, crate, crateKey = monthKey) {
  const songsById = new Map(
    songs
      .filter((s) => crate === 'all' || crateKey(s.createdAt) === crate)
      .map((s) => [s.id, s])
  )
  return comments
    .filter((c) => isFlagged(c.loaf) && songsById.has(c.songId))
    .map((c) => ({ comment: c, song: songsById.get(c.songId) }))
    .sort((a, b) => new Date(b.comment.createdAt) - new Date(a.comment.createdAt))
}
