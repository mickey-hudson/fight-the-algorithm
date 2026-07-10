import { useState } from 'react'

const EMPTY = { song: '', artist: '', genre: '', notes: '' }

export default function SongForm({ onSubmit, initial, submitLabel = 'Add suggestion', onCancel }) {
  const [fields, setFields] = useState(() =>
    initial
      ? {
          song: initial.song,
          artist: initial.artist,
          genre: initial.genre,
          notes: initial.notes,
        }
      : EMPTY
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function set(key) {
    return (e) => setFields((prev) => ({ ...prev, [key]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await onSubmit({
        song: fields.song.trim(),
        artist: fields.artist.trim(),
        genre: fields.genre.trim(),
        notes: fields.notes.trim(),
      })
      setFields(EMPTY)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const valid = fields.song.trim() && fields.artist.trim()

  return (
    <form className="card song-form" onSubmit={handleSubmit}>
      <label htmlFor="song">Song *</label>
      <input id="song" value={fields.song} onChange={set('song')} maxLength={200} autoFocus />

      <label htmlFor="artist">Artist *</label>
      <input id="artist" value={fields.artist} onChange={set('artist')} maxLength={200} />

      <label htmlFor="genre">Genre</label>
      <input
        id="genre"
        value={fields.genre}
        onChange={set('genre')}
        maxLength={50}
        placeholder="Pop, Jazz, Hyperpop…"
      />

      <label htmlFor="notes">Why this song?</label>
      <textarea
        id="notes"
        value={fields.notes}
        onChange={set('notes')}
        maxLength={2000}
        rows={3}
        placeholder="What makes it worth a listen?"
      />

      {error && <p className="status error">Couldn’t save: {error}</p>}
      <div className="form-actions">
        <button className="primary" type="submit" disabled={!valid || submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="link-button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
