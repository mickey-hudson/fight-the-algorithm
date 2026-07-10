import { useEffect, useMemo, useState } from 'react'
import {
  fetchAll,
  addSong,
  addComment,
  editSong,
  deleteSong,
  editComment,
  deleteComment,
  toggleMeatloaf,
  addUser,
  editUser,
  isMockMode,
} from './api'
import IdentityGate from './components/IdentityGate'
import ProfileForm from './components/ProfileForm'
import SongForm from './components/SongForm'
import SongList from './components/SongList'
import { byId } from './users'
import { currentMonthKey, monthKey } from './months'

const USER_KEY = 'fta-user-id'

export default function App() {
  const [userId, setUserId] = useState(() => localStorage.getItem(USER_KEY) || '')
  const [month, setMonth] = useState(currentMonthKey)
  const [users, setUsers] = useState([])
  const [songs, setSongs] = useState([])
  const [comments, setComments] = useState([])
  const [meatloafs, setMeatloafs] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)

  useEffect(() => {
    fetchAll()
      .then((data) => {
        setUsers(data.users || [])
        setSongs(data.songs)
        setComments(data.comments)
        setMeatloafs(data.meatloafs || [])
        setPlaylists(data.playlists || [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const usersById = useMemo(() => byId(users), [users])
  // A stored id that no longer exists (user row deleted) falls back to the gate.
  const currentUser = usersById[userId]

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
    const song = await addSong({ ...fields, userId })
    setSongs((prev) => [...prev, song])
    setShowForm(false)
    // Jump to the new song's month so the submission is always visible.
    setMonth(monthKey(song.createdAt))
  }

  async function handleAddComment(songId, text) {
    const comment = await addComment({ songId, userId, text })
    setComments((prev) => [...prev, comment])
  }

  async function handleEditSong(id, fields) {
    const updated = await editSong({ id, requester: userId, ...fields })
    setSongs((prev) => prev.map((s) => (s.id === id ? updated : s)))
  }

  async function handleDeleteSong(id) {
    await deleteSong({ id, requester: userId })
    setSongs((prev) => prev.filter((s) => s.id !== id))
    setComments((prev) => prev.filter((c) => c.songId !== id))
    setMeatloafs((prev) => prev.filter((m) => m.songId !== id))
  }

  async function handleToggleMeatloaf(songId) {
    const result = await toggleMeatloaf({ songId, userId })
    if (result.removed) {
      setMeatloafs((prev) =>
        prev.filter((m) => !(m.songId === songId && m.userId === userId))
      )
    } else {
      setMeatloafs((prev) => [...prev, result.meatloaf])
    }
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
          <h1>Fight the Algorithm</h1>
          <p className="tagline">Songs from friends, not the feed.</p>
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

      <button className="primary toggle-form" onClick={() => setShowForm((v) => !v)}>
        {showForm ? 'Never mind' : '+ Suggest a song'}
      </button>

      {showForm && <SongForm onSubmit={handleAddSong} />}

      {loading && <p className="status">Loading suggestions…</p>}
      {error && <p className="status error">Couldn’t load suggestions: {error}</p>}
      {!loading && !error && (
        <SongList
          songs={songs}
          comments={comments}
          meatloafs={meatloafs}
          playlists={playlists}
          usersById={usersById}
          onToggleMeatloaf={handleToggleMeatloaf}
          month={month}
          onSelectMonth={setMonth}
          currentUserId={userId}
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
