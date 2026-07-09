import { useEffect, useState } from 'react'
import { fetchAll, addSong, addComment, isMockMode } from './api'
import NamePrompt from './components/NamePrompt'
import SongForm from './components/SongForm'
import SongList from './components/SongList'

const NAME_KEY = 'fta-name'

export default function App() {
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) || '')
  const [songs, setSongs] = useState([])
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchAll()
      .then((data) => {
        setSongs(data.songs)
        setComments(data.comments)
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
  }

  async function handleAddComment(songId, text) {
    const comment = await addComment({ songId, author: name, text })
    setComments((prev) => [...prev, comment])
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
          onAddComment={handleAddComment}
        />
      )}
    </div>
  )
}
