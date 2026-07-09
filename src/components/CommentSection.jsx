import { useState } from 'react'

export default function CommentSection({ comments, onAdd }) {
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
        <p key={c.id} className="comment">
          <strong>{c.author}</strong> {c.text}
        </p>
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
