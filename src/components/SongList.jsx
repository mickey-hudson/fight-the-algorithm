import { useMemo, useState } from 'react'
import SongCard from './SongCard'
import MonthPills from './MonthPills'
import LoafLog from './LoafLog'
import PlaylistLinks from './PlaylistLinks'
import { monthKey, monthLabel, currentMonthKey } from '../months'
import { aliasOf } from '../users'

export default function SongList({
  songs,
  comments,
  playlists,
  usersById,
  month,
  onSelectMonth,
  currentUserId,
  isAdmin,
  onSetInPlaylists,
  onAddComment,
  onEditSong,
  onDeleteSong,
  onEditComment,
  onDeleteComment,
}) {
  const [genre, setGenre] = useState('')
  const [recommenderId, setRecommenderId] = useState('')
  const [view, setView] = useState('songs') // 'songs' | 'loaf' — sticky across month switches

  // Genre/recommender choices are scoped to a month's songs, so they reset on switch.
  function handleSelectMonth(key) {
    setGenre('')
    setRecommenderId('')
    onSelectMonth(key)
  }

  const months = useMemo(() => {
    const counts = new Map([[currentMonthKey(), 0]])
    for (const s of songs) {
      const key = monthKey(s.createdAt)
      if (key) counts.set(key, (counts.get(key) || 0) + 1)
    }
    return [...counts.keys()]
      .sort()
      .reverse()
      .map((key) => ({ key, label: monthLabel(key), count: counts.get(key) }))
  }, [songs])

  const inMonth = useMemo(
    () => (month === 'all' ? songs : songs.filter((s) => monthKey(s.createdAt) === month)),
    [songs, month]
  )

  const genres = useMemo(() => unique(inMonth.map((s) => s.genre)), [inMonth])
  const recommenders = useMemo(() => {
    const ids = [...new Set(inMonth.map((s) => s.userId).filter(Boolean))]
    return ids
      .map((id) => ({ id, alias: aliasOf(usersById, id) }))
      .sort((a, b) => a.alias.localeCompare(b.alias))
  }, [inMonth, usersById])

  const visible = inMonth
    .filter((s) => !genre || s.genre === genre)
    .filter((s) => !recommenderId || s.userId === recommenderId)
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  if (songs.length === 0) {
    return <p className="status">No suggestions yet — be the first!</p>
  }

  return (
    <section>
      <MonthPills
        months={months}
        total={songs.length}
        selected={month}
        onSelect={handleSelectMonth}
      />

      <PlaylistLinks playlists={playlists} month={month} />

      <div className="view-toggle" role="tablist" aria-label="View">
        <button
          type="button"
          role="tab"
          aria-selected={view === 'songs'}
          className={view === 'songs' ? 'view-tab active' : 'view-tab'}
          onClick={() => setView('songs')}
        >
          Suggestions
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'loaf'}
          className={view === 'loaf' ? 'view-tab active' : 'view-tab'}
          onClick={() => setView('loaf')}
        >
          Loaf Log
        </button>
      </div>

      {view === 'loaf' && (
        <LoafLog songs={songs} comments={comments} usersById={usersById} month={month} />
      )}

      {view === 'songs' && (
        <>
          <div className="filters">
            <select value={genre} onChange={(e) => setGenre(e.target.value)} aria-label="Filter by genre">
              <option value="">All genres</option>
              {genres.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <select
              value={recommenderId}
              onChange={(e) => setRecommenderId(e.target.value)}
              aria-label="Filter by recommender"
            >
              <option value="">Everyone</option>
              {recommenders.map((r) => (
                <option key={r.id} value={r.id}>{r.alias}</option>
              ))}
            </select>
          </div>

          {inMonth.length === 0 && (
            <p className="status">
              No suggestions in {monthLabel(month)} yet — be the first!
            </p>
          )}
          {inMonth.length > 0 && visible.length === 0 && (
            <p className="status">Nothing matches those filters.</p>
          )}
          <ul className="song-list">
            {visible.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                comments={comments.filter((c) => c.songId === song.id)}
                usersById={usersById}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                onSetInPlaylists={onSetInPlaylists}
                onAddComment={onAddComment}
                onEditSong={onEditSong}
                onDeleteSong={onDeleteSong}
                onEditComment={onEditComment}
                onDeleteComment={onDeleteComment}
              />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b))
}
