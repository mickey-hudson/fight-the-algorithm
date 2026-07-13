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

// Loaf moments for the given month ('all' = every month), newest first.
export function loafLog(songs, comments, month) {
  const songsById = new Map(
    songs
      .filter((s) => month === 'all' || monthKey(s.createdAt) === month)
      .map((s) => [s.id, s])
  )
  return comments
    .filter((c) => isFlagged(c.loaf) && songsById.has(c.songId))
    .map((c) => ({ comment: c, song: songsById.get(c.songId) }))
    .sort((a, b) => new Date(b.comment.createdAt) - new Date(a.comment.createdAt))
}
