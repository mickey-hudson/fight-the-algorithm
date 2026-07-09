import { useState } from 'react'
import CommentSection from './CommentSection'

export default function SongCard({ song, comments, onAddComment }) {
  const [showComments, setShowComments] = useState(false)

  return (
    <li className="card song-card">
      <div className="song-title-row">
        <h2>{song.song}</h2>
        {song.genre && <span className="genre-chip">{song.genre}</span>}
      </div>
      <p className="song-artist">{song.artist}</p>
      {song.notes && <p className="song-notes">“{song.notes}”</p>}
      <p className="song-meta">
        from <strong>{song.recommender}</strong> · {formatDate(song.createdAt)}
      </p>

      <button className="link-button" onClick={() => setShowComments((v) => !v)}>
        {showComments
          ? 'Hide comments'
          : comments.length
            ? `Comments (${comments.length})`
            : 'Add a comment'}
      </button>

      {showComments && (
        <CommentSection
          comments={comments}
          onAdd={(text) => onAddComment(song.id, text)}
        />
      )}
    </li>
  )
}

function formatDate(iso) {
  const date = new Date(iso)
  if (isNaN(date)) return ''
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
