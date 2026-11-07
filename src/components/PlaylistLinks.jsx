import { normalizeMonth } from '../months'

// Playlists come from the Playlists sheet tab: one row per month (YYYY-MM),
// an "all" row for the master playlist of every song, and one christmas-YYYY
// row per holiday edition. The curator can set these from the app (see
// PlaylistLinksAdmin) or edit the sheet directly. playlistKey is the row's
// month value; label is how to describe it ("Jul 2026 playlist").


function safeUrl(value) {
  const v = String(value || '').trim()
  return /^https?:\/\//i.test(v) ? v : ''
}

export default function PlaylistLinks({ playlists, playlistKey, label }) {
  const entry = playlists.find((p) => normalizeMonth(p.month) === playlistKey)
  if (!entry) return null

  const links = [
    { label: 'Spotify', url: safeUrl(entry.spotifyUrl) },
    { label: 'Apple Music', url: safeUrl(entry.appleMusicUrl) },
  ].filter((l) => l.url)
  if (links.length === 0) return null

  return (
    <p className="playlist-links">
      🎧 {label}:{' '}
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
