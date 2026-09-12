import { monthLabel, normalizeMonth } from '../months'

// Playlists come from the Playlists sheet tab: one row per month (YYYY-MM)
// plus an "all" row for the master playlist of every song. The curator can
// set these from the app (see PlaylistLinksAdmin) or edit the sheet directly.

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
