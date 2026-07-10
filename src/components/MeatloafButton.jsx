import { useState } from 'react'
import meatloafIcon from '../assets/meatloaf.png'
import { aliasOf } from '../users'

export default function MeatloafButton({ meatloafs, usersById, currentUserId, onToggle }) {
  const [busy, setBusy] = useState(false)
  const [showVoters, setShowVoters] = useState(false)
  const [error, setError] = useState('')

  const mine = meatloafs.some((m) => m.userId === currentUserId)
  const voters = meatloafs.map((m) => aliasOf(usersById, m.userId))

  async function handleToggle() {
    setBusy(true)
    setError('')
    try {
      await onToggle()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <span className="meatloaf">
      <button
        type="button"
        className={mine ? 'meatloaf-button active' : 'meatloaf-button'}
        onClick={handleToggle}
        disabled={busy}
        title={voters.length ? `Meatloafs from ${voters.join(', ')}` : 'Give this a meatloaf'}
        aria-label={mine ? 'Take back your meatloaf' : 'Give a meatloaf'}
        aria-pressed={mine}
      >
        <img src={meatloafIcon} alt="" />
      </button>
      {voters.length > 0 && (
        <button
          type="button"
          className="link-button meatloaf-count"
          onClick={() => setShowVoters((v) => !v)}
          aria-label="Show who gave meatloafs"
        >
          {voters.length}
        </button>
      )}
      {showVoters && voters.length > 0 && (
        <span className="meatloaf-voters">{voters.join(', ')}</span>
      )}
      {error && <span className="status error inline-error">{error}</span>}
    </span>
  )
}
