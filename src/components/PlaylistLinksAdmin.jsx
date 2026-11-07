import { useEffect, useState } from 'react'
import { normalizeMonth } from '../months'

// Admin-only control (see App's isAdmin) for setting the Spotify / Apple Music
// links for the selected crate's playlist (a month, the master playlist, or a
// christmas-YYYY holiday playlist), replacing the need to edit the Playlists
// sheet by hand.
export default function PlaylistLinksAdmin({ playlists, playlistKey, label, onSave }) {
  const entry = playlists.find((p) => normalizeMonth(p.month) === playlistKey)
  const [editing, setEditing] = useState(false)
  const [fields, setFields] = useState(() => draftFrom(entry))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Switching crates should always start from that playlist's saved links, not
  // whatever was left over in the form.
  useEffect(() => {
    setFields(draftFrom(entry))
    setEditing(false)
    setError('')
  }, [playlistKey]) // eslint-disable-line react-hooks/exhaustive-deps

  function set(key) {
    return (e) => setFields((prev) => ({ ...prev, [key]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await onSave(playlistKey, {
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

  // Mid-sentence, "Master playlist" reads better lowercased; month and holiday
  // labels start with proper nouns and stay as they are.
  const buttonLabel = label === 'Master playlist' ? 'master playlist' : label

  if (!editing) {
    return (
      <button className="link-button playlist-admin-toggle" onClick={() => setEditing(true)}>
        {entry ? `Edit ${buttonLabel} links` : `Set ${buttonLabel} links`}
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
