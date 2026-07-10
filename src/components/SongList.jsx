import { useMemo, useState } from 'react'
import SongCard from './SongCard'

export default function SongList({
  songs,
  comments,
  currentUser,
  onAddComment,
  onEditSong,
  onDeleteSong,
  onEditComment,
  onDeleteComment,
}) {
  const [genre, setGenre] = useState('')
  const [recommender, setRecommender] = useState('')

  const genres = useMemo(
    () => unique(songs.map((s) => s.genre)),
    [songs]
  )
  const recommenders = useMemo(
    () => unique(songs.map((s) => s.recommender)),
    [songs]
  )

  const visible = songs
    .filter((s) => !genre || s.genre === genre)
    .filter((s) => !recommender || s.recommender === recommender)
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  if (songs.length === 0) {
    return <p className="status">No suggestions yet — be the first!</p>
  }

  return (
    <section>
      <div className="filters">
        <select value={genre} onChange={(e) => setGenre(e.target.value)} aria-label="Filter by genre">
          <option value="">All genres</option>
          {genres.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select
          value={recommender}
          onChange={(e) => setRecommender(e.target.value)}
          aria-label="Filter by recommender"
        >
          <option value="">Everyone</option>
          {recommenders.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {visible.length === 0 && <p className="status">Nothing matches those filters.</p>}
      <ul className="song-list">
        {visible.map((song) => (
          <SongCard
            key={song.id}
            song={song}
            comments={comments.filter((c) => c.songId === song.id)}
            currentUser={currentUser}
            onAddComment={onAddComment}
            onEditSong={onEditSong}
            onDeleteSong={onDeleteSong}
            onEditComment={onEditComment}
            onDeleteComment={onDeleteComment}
          />
        ))}
      </ul>
    </section>
  )
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b))
}
