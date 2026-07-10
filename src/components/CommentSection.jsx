import { useState } from 'react'
import ConfirmButton from './ConfirmButton'

export default function CommentSection({ comments, currentUser, onAdd, onEdit, onDelete }) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const sorted = comments
    .slice()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    setSubmitting(true)
    setError('')
    try {
      await onAdd(trimmed)
      setText('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="comments">
      {sorted.map((c) => (
        <Comment
          key={c.id}
          comment={c}
          isOwner={c.author === currentUser}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
      <form onSubmit={handleSubmit} className="comment-form">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment…"
          maxLength={2000}
          aria-label="Add a comment"
        />
        <button className="primary" type="submit" disabled={!text.trim() || submitting}>
          {submitting ? '…' : 'Post'}
        </button>
      </form>
      {error && <p className="status error">Couldn’t post: {error}</p>}
    </div>
  )
}

function Comment({ comment, isOwner, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(comment.text)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e) {
    e.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed) return
    setSaving(true)
    setError('')
    try {
      await onEdit(comment.id, trimmed)
      setEditing(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <form onSubmit={handleSave} className="comment-form comment-edit">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={2000}
          aria-label="Edit comment"
          autoFocus
        />
        <button className="primary" type="submit" disabled={!draft.trim() || saving}>
          {saving ? '…' : 'Save'}
        </button>
        <button
          type="button"
          className="link-button"
          onClick={() => {
            setEditing(false)
            setDraft(comment.text)
          }}
        >
          Cancel
        </button>
        {error && <p className="status error">Couldn’t save: {error}</p>}
      </form>
    )
  }

  return (
    <p className="comment">
      <strong>{comment.author}</strong> {comment.text}
      {isOwner && (
        <span className="comment-actions">
          <button className="link-button" onClick={() => setEditing(true)}>
            Edit
          </button>
          <ConfirmButton
            label="Delete"
            confirmLabel="Really delete?"
            onConfirm={() => onDelete(comment.id)}
          />
        </span>
      )}
    </p>
  )
}
