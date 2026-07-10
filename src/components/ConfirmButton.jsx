import { useEffect, useRef, useState } from 'react'

// Two-step delete: first click arms the button, second click within 4s confirms.
export default function ConfirmButton({ label, confirmLabel, onConfirm }) {
  const [armed, setArmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function handleClick() {
    if (!armed) {
      setArmed(true)
      timer.current = setTimeout(() => setArmed(false), 4000)
      return
    }
    clearTimeout(timer.current)
    setBusy(true)
    setError('')
    try {
      await onConfirm()
    } catch (err) {
      setError(err.message)
      setArmed(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button className="link-button danger" onClick={handleClick} disabled={busy}>
        {busy ? 'Deleting…' : armed ? confirmLabel : label}
      </button>
      {error && <span className="status error inline-error">{error}</span>}
    </>
  )
}
