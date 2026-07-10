import meatloafIcon from '../assets/meatloaf.png'
import { monthLabel } from '../months'
import { monthlyLoafList, allTimeLoafList, ALL_TIME_CAP } from '../loaf'
import { aliasOf } from '../users'

const MEDALS = ['🥇', '🥈', '🥉']

export default function LoafList({ songs, meatloafs, usersById, month }) {
  const allTime = month === 'all'
  const entries = allTime
    ? allTimeLoafList(songs, meatloafs)
    : monthlyLoafList(songs, meatloafs, month)

  return (
    <div className="loaf-list">
      <h2 className="loaf-heading">
        {allTime ? `All-time LOAF Top ${ALL_TIME_CAP}` : `${monthLabel(month)} LOAF list`}
      </h2>
      <p className="loaf-subtitle">
        {allTime
          ? 'Two outta three aint bad, but these are tens'
          : 'Listener Obsession, Absolute Fire'}
      </p>

      {entries.length === 0 && (
        <p className="status">
          {allTime
            ? 'No songs have been meatloaf-ed yet.'
            : `Nothing meatloaf-ed in ${monthLabel(month)} yet — go show a song some love!`}
        </p>
      )}

      <ol className="loaf-entries">
        {entries.map(({ song, count }, i) => (
          <li key={song.id} className="loaf-entry">
            <span className="loaf-rank">{MEDALS[i] || `${i + 1}.`}</span>
            <span className="loaf-song">
              <span className="loaf-title">{song.song}</span>
              <span className="loaf-artist">
                {song.artist} · from {aliasOf(usersById, song.userId)}
              </span>
            </span>
            <span className="loaf-count">
              <img src={meatloafIcon} alt="Meatloafs" /> {count}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
