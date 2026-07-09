import { useState } from 'react'

export default function NamePrompt({ onSubmit }) {
  const [value, setValue] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const name = value.trim()
    if (name) onSubmit(name)
  }

  return (
    <div className="app name-prompt">
      <h1>Fight the Algorithm</h1>
      <p className="tagline">Songs from friends, not the feed.</p>
      <form onSubmit={handleSubmit} className="card">
        <label htmlFor="name">Who are you?</label>
        <input
          id="name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Your name"
          maxLength={50}
          autoFocus
        />
        <button className="primary" type="submit" disabled={!value.trim()}>
          Let’s go
        </button>
        <p className="hint">
          Your name is stamped on your suggestions and comments so friends know
          who to thank.
        </p>
      </form>
    </div>
  )
}
