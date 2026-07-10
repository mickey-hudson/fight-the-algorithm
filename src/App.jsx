import { useEffect, useState } from 'react'
import {
  fetchAll,
  addSong,
  addComment,
  editSong,
  deleteSong,
  editComment,
  deleteComment,
  toggleMeatloaf,
  isMockMode,
} from './api'
import NamePrompt from './components/NamePrompt'
import SongForm from './components/SongForm'
import SongList from './components/SongList'
import { currentMonthKey, monthKey } from './months'

const NAME_KEY = 'fta-name'

export default function App() {
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) || '')
  const [month, setMonth] = useState(currentMonthKey)
  const [songs, setSongs] = useState([])
  const [comments, setComments] = useState([])
  const [meatloafs, setMeatloafs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchAll()
      .then((data) => {
        setSongs(data.songs)
        setComments(data.comments)
        // Tolerate a backend that predates meatloafs (not yet redeployed).
        setMeatloafs(data.meatloafs || [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  function handleSetName(newName) {
    localStorage.setItem(NAME_KEY, newName)
    setName(newName)
  }

  async function handleAddSong(fields) {
    const song = await addSong({ ...fields, recommender: name })
    setSongs((prev) => [...prev, song])
    setShowForm(false)
    // Jump to the new song's month so the submission is always visible.
    setMonth(monthKey(song.createdAt))
  }

  async function handleAddComment(songId, text) {
    const comment = await addComment({ songId, author: name, text })
    setComments((prev) => [...prev, comment])
  }

  async function handleEditSong(id, fields) {
    const updated = await editSong({ id, requester: name, ...fields })
    setSongs((prev) => prev.map((s) => (s.id === id ? updated : s)))
  }

  async function handleDeleteSong(id) {
    await deleteSong({ id, requester: name })
    setSongs((prev) => prev.filter((s) => s.id !== id))
    setComments((prev) => prev.filter((c) => c.songId !== id))
    setMeatloafs((prev) => prev.filter((m) => m.songId !== id))
  }

  async function handleToggleMeatloaf(songId) {
    const result = await toggleMeatloaf({ songId, voter: name })
    if (result.removed) {
      setMeatloafs((prev) =>
        prev.filter((m) => !(m.songId === songId && m.voter === name))
      )
    } else {
      setMeatloafs((prev) => [...prev, result.meatloaf])
    }
  }

  async function handleEditComment(id, text) {
    const updated = await editComment({ id, requester: name, text })
    setComments((prev) => prev.map((c) => (c.id === id ? updated : c)))
  }

  async function handleDeleteComment(id) {
    await deleteComment({ id, requester: name })
    setComments((prev) => prev.filter((c) => c.id !== id))
  }

  if (!name) {
    return <NamePrompt onSubmit={handleSetName} />
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Fight the Algorithm</h1>
          <p className="tagline">Songs from friends, not the feed.</p>
        </div>
        <div className="whoami">
          {name}{' '}
          <button className="link-button" onClick={() => handleSetName('')}>
            not you?
          </button>
        </div>
      </header>

      {isMockMode && (
        <p className="mock-banner">
          Demo mode — no backend configured, data stays in this browser.
        </p>
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
          onToggleMeatloaf={handleToggleMeatloaf}
          month={month}
          onSelectMonth={setMonth}
          currentUser={name}
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
