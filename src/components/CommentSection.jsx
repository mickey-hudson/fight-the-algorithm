import { useState } from 'react'
import ConfirmButton from './ConfirmButton'
import meatloafIcon from '../assets/meatloaf.png'
import scubaIcon from '../assets/scuba-steve.png'
import { isFlagged } from '../loaf'
import { aliasOf } from '../users'

export const LOAF_TIP = 'Listener Obsessed, Absolute Fire'
const FIRST_TIMER_TIP = 'First Timer — this song was new to me'

export default function CommentSection({
  comments,
  usersById,
  currentUserId,
  onAdd,
  onEdit,
  onDelete,
}) {
  const [text, setText] = useState('')
  const [loaf, setLoaf] = useState(false)
  const [firstTimer, setFirstTimer] = useState(false)
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
      await onAdd(trimmed, { loaf, firstTimer })
      setText('')
      setLoaf(false)
      setFirstTimer(false)
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
          alias={aliasOf(usersById, c.userId)}
          isOwner={c.userId === currentUserId}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
      <form onSubmit={handleSubmit} className="comment-composer">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Say something about this song…"
          maxLength={2000}
          aria-label="Add a comment"
        />
        <div className="composer-actions">
          <button
            type="button"
            className="badge-toggle"
            aria-pressed={loaf}
            title={LOAF_TIP}
            onClick={() => setLoaf((v) => !v)}
          >
            <img src={meatloafIcon} alt="" />
            <span className="loaf-letters">L.O.A.F.</span>
          </button>
          <button
            type="button"
            className="badge-toggle"
            aria-pressed={firstTimer}
            title={FIRST_TIMER_TIP}
            onClick={() => setFirstTimer((v) => !v)}
          >
            <img className="scuba" src={scubaIcon} alt="" />
            First Timer
          </button>
          <button className="primary" type="submit" disabled={!text.trim() || submitting}>
            {submitting ? '…' : 'Post'}
          </button>
        </div>
      </form>
      {error && <p className="status error">Couldn’t post: {error}</p>}
    </div>
  )
}

function CommentBadges({ comment }) {
  return (
    <>
      {isFlagged(comment.loaf) && (
        <span className="loaf-chip" title={LOAF_TIP}>
          <img src={meatloafIcon} alt="Meatloaf" />
          <span className="loaf-letters">L.O.A.F.</span>
        </span>
      )}
      {isFlagged(comment.firstTimer) && (
        <span className="loaf-chip first-timer" title={FIRST_TIMER_TIP}>
          <img className="scuba" src={scubaIcon} alt="Scuba Steve" />
          first timer
        </span>
      )}
    </>
  )
}

function Comment({ comment, alias, isOwner, onEdit, onDelete }) {
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
      <strong>{alias}</strong> {comment.text}
      <CommentBadges comment={comment} />
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
