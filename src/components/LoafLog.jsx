import { useMemo, useState } from 'react'
import meatloafIcon from '../assets/meatloaf.png'
import { LOAF_TIP } from './CommentSection'
import { isFlagged, loafLog } from '../loaf'
import { monthLabel } from '../months'
import { aliasOf } from '../users'

export default function LoafLog({ songs, comments, usersById, month }) {
  const newestFirst = useMemo(
    () => loafLog(songs, comments, month),
    [songs, comments, month]
  )
  const [shuffles, setShuffles] = useState(0)
  const entries = useMemo(
    () => (shuffles === 0 ? newestFirst : shuffle(newestFirst)),
    [newestFirst, shuffles]
  )

  return (
    <div className="loaf-log">
      <h2 className="loaf-heading" title={LOAF_TIP}>
        The Loaf Log
      </h2>
      <p className="loaf-subtitle">
        No counts, no ranks. Order means nothing; the comments mean everything.
      </p>

      {entries.length === 0 && (
        <p className="status">
          {month === 'all'
            ? 'No songs have been meatloaf-ed yet.'
            : `Nothing meatloaf-ed in ${monthLabel(month)} yet — go say something nice!`}
        </p>
      )}

      {entries.length > 1 && (
        <div className="log-toolbar">
          <button
            type="button"
            className="link-button"
            onClick={() => setShuffles((n) => n + 1)}
          >
            shuffle — because order means nothing
          </button>
        </div>
      )}

      <ul className="loaf-entries">
        {entries.map(({ comment, song }) => (
          <li key={comment.id} className="loaf-entry">
            <img src={meatloafIcon} alt="" />
            <div className="loaf-entry-body">
              <span className="loaf-line">
                <strong className="loaf-who">{aliasOf(usersById, comment.userId)}</strong>{' '}
                meatloafed <strong>{song.song}</strong>
                {isFlagged(comment.firstTimer) && ' — a first listen, no less'}
              </span>
              <span className="loaf-quote">“{comment.text}”</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function shuffle(entries) {
  const result = entries.slice()
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
