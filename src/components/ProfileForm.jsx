import { useState } from 'react'

// Used both for first-time registration and for editing your profile.
export default function ProfileForm({ initial, submitLabel = 'Save', onSubmit, onCancel }) {
  const [fields, setFields] = useState(() => ({
    firstName: initial?.firstName || '',
    lastName: initial?.lastName || '',
    alias: initial?.alias || '',
  }))
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
        firstName: fields.firstName.trim(),
        lastName: fields.lastName.trim(),
        alias: fields.alias.trim(),
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const valid = fields.firstName.trim() && fields.alias.trim()

  return (
    <form className="card profile-form" onSubmit={handleSubmit}>
      <label htmlFor="firstName">First name *</label>
      <input
        id="firstName"
        value={fields.firstName}
        onChange={set('firstName')}
        maxLength={50}
        autoFocus
      />

      <label htmlFor="lastName">Last name</label>
      <input id="lastName" value={fields.lastName} onChange={set('lastName')} maxLength={50} />

      <label htmlFor="alias">DJ alias *</label>
      <input
        id="alias"
        value={fields.alias}
        onChange={set('alias')}
        maxLength={50}
        placeholder="DJ Meatloaf, Moonchild…"
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
