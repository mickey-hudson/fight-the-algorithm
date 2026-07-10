// LOAF (Listener Obsession, Absolute Fire): songs that have been meatloaf-ed.
// Rankings are derived entirely from data the app already has — no backend involved.

import { monthKey } from './months'

export const ALL_TIME_CAP = 10

// Ranks songs by meatloaf count (desc), ties broken by whose latest meatloaf is
// newest. Songs with zero meatloafs never make the list.
function rank(songs, meatloafs) {
  const stats = new Map()
  for (const m of meatloafs) {
    const s = stats.get(m.songId) || { count: 0, latestLoafAt: 0 }
    s.count += 1
    s.latestLoafAt = Math.max(s.latestLoafAt, new Date(m.createdAt).getTime() || 0)
    stats.set(m.songId, s)
  }
  return songs
    .filter((song) => stats.has(song.id))
    .map((song) => ({ song, ...stats.get(song.id) }))
    .sort((a, b) => b.count - a.count || b.latestLoafAt - a.latestLoafAt)
}

export function monthlyLoafList(songs, meatloafs, month) {
  return rank(
    songs.filter((s) => monthKey(s.createdAt) === month),
    meatloafs
  )
}

export function allTimeLoafList(songs, meatloafs) {
  return rank(songs, meatloafs).slice(0, ALL_TIME_CAP)
}
