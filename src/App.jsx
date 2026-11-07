import { useEffect, useMemo, useState } from 'react'
import {
  fetchAll,
  addSong,
  addComment,
  editSong,
  deleteSong,
  editComment,
  deleteComment,
  setInPlaylists,
  setPlaylistLinks,
  addUser,
  editUser,
  isMockMode,
} from './api'
import { ADMIN_USER_IDS } from './config'
import IdentityGate from './components/IdentityGate'
import ProfileForm from './components/ProfileForm'
import SongForm from './components/SongForm'
import SongList from './components/SongList'
import { byId } from './users'
import { holidaySeasonStart, isHolidaySeason, normalizeMonth } from './months'

const USER_KEY = 'fta-user-id'

// Holiday-page URL, relative to the site root (see vite.config.js).
const HOLIDAY_PATH = '/holiday/'

export default function App({ edition }) {
  const [userId, setUserId] = useState(() => localStorage.getItem(USER_KEY) || '')
  // The selected crate: a month on the main page, a year on the holiday page.
  // The holiday page has no current crate outside the holiday season, so it picks one
  // once the songs load (see below).
  const [month, setMonth] = useState(() => edition.seedCrate() || 'all')
  const [users, setUsers] = useState([])
  const [songs, setSongs] = useState([])
  const [comments, setComments] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)

  useEffect(() => {
    fetchAll()
      .then((data) => {
        const loaded = data[edition.songsKey] || []
        setUsers(data.users || [])
        setSongs(loaded)
        if (!edition.seedCrate()) {
          const newest = loaded
            .map((s) => edition.crateKey(s.createdAt))
            .filter(Boolean)
            .sort()
            .pop()
          setMonth(newest || 'all')
        }
        setComments(data.comments)
        setPlaylists(data.playlists || [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [edition])

  const usersById = useMemo(() => byId(users), [users])
  // A stored id that no longer exists (user row deleted) falls back to the gate.
  const currentUser = usersById[userId]
  const isAdmin = ADMIN_USER_IDS.includes(userId)

  function handleSelectUser(id) {
    localStorage.setItem(USER_KEY, id)
    setUserId(id)
  }

  async function handleRegister(fields) {
    const user = await addUser(fields)
    setUsers((prev) => [...prev, user])
    handleSelectUser(user.id)
  }

  async function handleEditProfile(fields) {
    const updated = await editUser({ id: userId, ...fields })
    setUsers((prev) => prev.map((a) => (a.id === userId ? updated : a)))
    setEditingProfile(false)
  }

  async function handleAddSong(fields) {
    const song = await addSong({ ...fields, userId, list: edition.list })
    setSongs((prev) => [...prev, song])
    setShowForm(false)
    // Jump to the new song's crate so the submission is always visible.
    setMonth(edition.crateKey(song.createdAt))
  }

  async function handleAddComment(songId, text, { loaf, firstTimer }) {
    const comment = await addComment({ songId, userId, text, loaf, firstTimer })
    setComments((prev) => [...prev, comment])
  }

  async function handleEditSong(id, fields) {
    const updated = await editSong({ id, requester: userId, list: edition.list, ...fields })
    setSongs((prev) => prev.map((s) => (s.id === id ? updated : s)))
  }

  async function handleDeleteSong(id) {
    await deleteSong({ id, requester: userId, list: edition.list })
    setSongs((prev) => prev.filter((s) => s.id !== id))
    setComments((prev) => prev.filter((c) => c.songId !== id))
  }

  async function handleSetInPlaylists(songId, value) {
    const updated = await setInPlaylists({
      id: songId,
      requester: userId,
      list: edition.list,
      inPlaylists: value ? 'true' : 'false',
    })
    setSongs((prev) => prev.map((s) => (s.id === songId ? updated : s)))
  }

  async function handleSetPlaylistLinks(month, fields) {
    const updated = await setPlaylistLinks({ month, requester: userId, ...fields })
    setPlaylists((prev) => {
      const idx = prev.findIndex((p) => normalizeMonth(p.month) === normalizeMonth(updated.month))
      if (idx === -1) return [...prev, updated]
      const next = [...prev]
      next[idx] = updated
      return next
    })
  }

  async function handleEditComment(id, text) {
    const updated = await editComment({ id, requester: userId, text })
    setComments((prev) => prev.map((c) => (c.id === id ? updated : c)))
  }

  async function handleDeleteComment(id) {
    await deleteComment({ id, requester: userId })
    setComments((prev) => prev.filter((c) => c.id !== id))
  }

  if (!currentUser) {
    return (
      <IdentityGate
        title={edition.title}
        tagline={edition.tagline}
        users={users}
        loading={loading}
        error={error}
        onSelect={handleSelectUser}
        onRegister={handleRegister}
      />
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>{edition.title}</h1>
          <p className="tagline">{edition.tagline}</p>
        </div>
        <div className="whoami">
          <span className="whoami-identity">
            Signed in as <strong>{currentUser.alias}</strong>
          </span>
          <span className="whoami-actions">
            <button className="link-button" onClick={() => setEditingProfile((v) => !v)}>
              Edit profile
            </button>
            <span aria-hidden="true">·</span>
            <button className="link-button" onClick={() => handleSelectUser('')}>
              Not you?
            </button>
          </span>
        </div>
      </header>

      {edition.id === 'main' && isHolidaySeason() && (
        <a className="edition-link holiday-banner" href={HOLIDAY_PATH}>
          🎄 The Holiday Edition is open — suggest Christmas songs →
        </a>
      )}
      {edition.id === 'holiday' && (
        <a className="edition-link" href="/">
          ← Back to Fight the Algorithm
        </a>
      )}

      {isMockMode && (
        <p className="mock-banner">
          Demo mode — no backend configured, data stays in this browser.
        </p>
      )}

      {editingProfile && (
        <ProfileForm
          initial={currentUser}
          submitLabel="Save profile"
          onSubmit={handleEditProfile}
          onCancel={() => setEditingProfile(false)}
        />
      )}

      {edition.canSubmit() ? (
        <>
          <button className="primary toggle-form" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Never mind' : edition.suggestLabel}
          </button>
          {showForm && (
            <SongForm onSubmit={handleAddSong} genrePlaceholder={edition.genrePlaceholder} />
          )}
        </>
      ) : (
        <p className="status submissions-closed">
          Holiday suggestions open {formatSeasonStart()} 🎄
        </p>
      )}

      {loading && <p className="status">Loading suggestions…</p>}
      {error && <p className="status error">Couldn’t load suggestions: {error}</p>}
      {!loading && !error && (
        <SongList
          edition={edition}
          songs={songs}
          comments={comments}
          playlists={playlists}
          usersById={usersById}
          month={month}
          onSelectMonth={setMonth}
          currentUserId={userId}
          isAdmin={isAdmin}
          onSetInPlaylists={handleSetInPlaylists}
          onSetPlaylistLinks={handleSetPlaylistLinks}
          onAddComment={handleAddComment}
          onEditSong={handleEditSong}
          onDeleteSong={handleDeleteSong}
          onEditComment={handleEditComment}
          onDeleteComment={handleDeleteComment}
        />
      )}
    </div>
  )
}

// Outside the season it's always before this year's start, since the season
// runs through December 31. e.g. "Friday, Nov 27".
function formatSeasonStart() {
  return holidaySeasonStart(new Date().getFullYear()).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}
