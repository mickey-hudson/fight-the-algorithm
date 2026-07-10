import { useState } from 'react'
import ProfileForm from './ProfileForm'
import { userLabel } from '../users'

// First visit (or cleared browser): pick yourself from the crew, or register.
// Honor system — same trust level as the old free-text name prompt.
export default function IdentityGate({ users, loading, error, onSelect, onRegister }) {
  const [registering, setRegistering] = useState(false)
  const [query, setQuery] = useState('')

  const matches = users
    .filter((a) => userLabel(a).toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => userLabel(a).localeCompare(userLabel(b)))

  const showRegister = registering || (!loading && !error && users.length === 0)

  return (
    <div className="app name-prompt">
      <h1>Fight the Algorithm</h1>
      <p className="tagline">Songs from friends, not the feed.</p>

      {loading && <p className="status">Loading the crew…</p>}
      {error && <p className="status error">Couldn’t load: {error}</p>}

      {!loading && !error && showRegister && (
        <>
          <ProfileForm
            submitLabel="Let’s go"
            onSubmit={onRegister}
            onCancel={users.length > 0 ? () => setRegistering(false) : undefined}
          />
          <p className="hint">
            Your DJ alias is stamped on your suggestions and comments so friends
            know who to thank.
          </p>
        </>
      )}

      {!loading && !error && !showRegister && (
        <div className="card identity-picker">
          <label htmlFor="user-search">Who are you?</label>
          <input
            id="user-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Start typing your name…"
            autoFocus
            autoComplete="off"
          />
          <ul className="user-list">
            {matches.map((a) => (
              <li key={a.id}>
                <button type="button" className="user-option" onClick={() => onSelect(a.id)}>
                  {userLabel(a)}
                </button>
              </li>
            ))}
            {matches.length === 0 && <li className="hint">No one matches “{query}”.</li>}
          </ul>
          <button type="button" className="link-button" onClick={() => setRegistering(true)}>
            New here? Create your DJ profile
          </button>
        </div>
      )}
    </div>
  )
}
