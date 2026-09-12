import { useEffect, useState } from 'react'
import { monthLabel, normalizeMonth } from '../months'

// Admin-only control (see App's isAdmin) for setting the Spotify / Apple Music
// links for the selected month, replacing the need to edit the Playlists
// sheet by hand.
export default function PlaylistLinksAdmin({ playlists, month, onSave }) {
  const entry = playlists.find((p) => normalizeMonth(p.month) === month)
  const [editing, setEditing] = useState(false)
  const [fields, setFields] = useState(() => draftFrom(entry))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Switching months should always start from that month's saved links, not
  // whatever was left over in the form.
  useEffect(() => {
    setFields(draftFrom(entry))
    setEditing(false)
    setError('')
  }, [month]) // eslint-disable-line react-hooks/exhaustive-deps

  function set(key) {
    return (e) => setFields((prev) => ({ ...prev, [key]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await onSave(month, {
        spotifyUrl: fields.spotifyUrl.trim(),
        appleMusicUrl: fields.appleMusicUrl.trim(),
      })
      setEditing(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const label = month === 'all' ? 'master playlist' : `${monthLabel(month)} playlist`

  if (!editing) {
    return (
      <button className="link-button playlist-admin-toggle" onClick={() => setEditing(true)}>
        {entry ? `Edit ${label} links` : `Set ${label} links`}
      </button>
    )
  }

  return (
    <form className="card playlist-admin-form" onSubmit={handleSubmit}>
      <label htmlFor="spotifyUrl">Spotify URL</label>
      <input
        id="spotifyUrl"
        type="url"
        value={fields.spotifyUrl}
        onChange={set('spotifyUrl')}
        placeholder="https://open.spotify.com/playlist/…"
      />

      <label htmlFor="appleMusicUrl">Apple Music URL</label>
      <input
        id="appleMusicUrl"
        type="url"
        value={fields.appleMusicUrl}
        onChange={set('appleMusicUrl')}
        placeholder="https://music.apple.com/playlist/…"
      />

      {error && <p className="status error">Couldn’t save: {error}</p>}
      <div className="form-actions">
        <button className="primary" type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save links'}
        </button>
        <button type="button" className="link-button" onClick={() => setEditing(false)}>
          Cancel
        </button>
      </div>
    </form>
  )
}

function draftFrom(entry) {
  return {
    spotifyUrl: entry?.spotifyUrl || '',
    appleMusicUrl: entry?.appleMusicUrl || '',
  }
}
