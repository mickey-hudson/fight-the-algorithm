import { useState } from 'react'
import CommentSection from './CommentSection'
import ConfirmButton from './ConfirmButton'
import MeatloafButton from './MeatloafButton'
import SongForm from './SongForm'

export default function SongCard({
  song,
  comments,
  meatloafs,
  onToggleMeatloaf,
  currentUser,
  onAddComment,
  onEditSong,
  onDeleteSong,
  onEditComment,
  onDeleteComment,
}) {
  const [showComments, setShowComments] = useState(false)
  const [editing, setEditing] = useState(false)
  const isOwner = song.recommender === currentUser

  if (editing) {
    return (
      <li className="card song-card">
        <SongForm
          initial={song}
          submitLabel="Save changes"
          onCancel={() => setEditing(false)}
          onSubmit={async (fields) => {
            await onEditSong(song.id, fields)
            setEditing(false)
          }}
        />
      </li>
    )
  }

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

      <div className="card-actions">
        <MeatloafButton
          meatloafs={meatloafs}
          currentUser={currentUser}
          onToggle={() => onToggleMeatloaf(song.id)}
        />
        <button className="link-button" onClick={() => setShowComments((v) => !v)}>
          {showComments
            ? 'Hide comments'
            : comments.length
              ? `Comments (${comments.length})`
              : 'Add a comment'}
        </button>
        {isOwner && (
          <>
            <button className="link-button" onClick={() => setEditing(true)}>
              Edit
            </button>
            <ConfirmButton
              label="Delete"
              confirmLabel="Delete song + comments?"
              onConfirm={() => onDeleteSong(song.id)}
            />
          </>
        )}
      </div>

      {showComments && (
        <CommentSection
          comments={comments}
          currentUser={currentUser}
          onAdd={(text) => onAddComment(song.id, text)}
          onEdit={onEditComment}
          onDelete={onDeleteComment}
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
