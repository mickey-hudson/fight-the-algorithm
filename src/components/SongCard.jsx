import { useState } from 'react'
import CommentSection from './CommentSection'
import ConfirmButton from './ConfirmButton'
import MeatloafButton from './MeatloafButton'
import SongForm from './SongForm'
import { aliasOf } from '../users'

export default function SongCard({
  song,
  comments,
  meatloafs,
  usersById,
  onToggleMeatloaf,
  currentUserId,
  onAddComment,
  onEditSong,
  onDeleteSong,
  onEditComment,
  onDeleteComment,
}) {
  const [showComments, setShowComments] = useState(false)
  const [editing, setEditing] = useState(false)
  const isOwner = song.userId === currentUserId

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
        from <strong>{aliasOf(usersById, song.userId)}</strong> ·{' '}
        {formatDate(song.createdAt)}
      </p>

      <div className="card-actions">
        <MeatloafButton
          meatloafs={meatloafs}
          usersById={usersById}
          currentUserId={currentUserId}
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
          usersById={usersById}
          currentUserId={currentUserId}
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
