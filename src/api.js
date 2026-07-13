import { APPS_SCRIPT_URL } from './config'

// POST bodies are sent as plain text (fetch's default for string bodies) rather than
// application/json: Apps Script can't answer CORS preflight OPTIONS requests, and
// text/plain keeps the request "simple" so no preflight happens.
async function post(payload) {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Request failed (${res.status})`)
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data
}

async function get() {
  const res = await fetch(APPS_SCRIPT_URL)
  if (!res.ok) throw new Error(`Request failed (${res.status})`)
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data
}

export const isMockMode = !APPS_SCRIPT_URL

export async function fetchAll() {
  if (isMockMode) return mockFetchAll()
  return get()
}

export async function addSong(fields) {
  // The real backend defaults inPlaylists; the mock has to do it itself.
  if (isMockMode) return mockAdd('songs', { inPlaylists: 'false', ...fields })
  const data = await post({ action: 'addSong', ...fields })
  return data.song
}

export async function addComment(fields) {
  if (isMockMode) return mockAdd('comments', fields)
  const data = await post({ action: 'addComment', ...fields })
  return data.comment
}

export async function editSong(fields) {
  if (isMockMode) return mockEdit('songs', fields)
  const data = await post({ action: 'editSong', ...fields })
  return data.song
}

export async function deleteSong(fields) {
  if (isMockMode) return mockDelete('songs', fields)
  return post({ action: 'deleteSong', ...fields })
}

export async function editComment(fields) {
  if (isMockMode) return mockEdit('comments', fields)
  const data = await post({ action: 'editComment', ...fields })
  return data.comment
}

export async function deleteComment(fields) {
  if (isMockMode) return mockDelete('comments', fields)
  return post({ action: 'deleteComment', ...fields })
}

export async function setInPlaylists(fields) {
  if (isMockMode) return mockEdit('songs', fields)
  const data = await post({ action: 'setInPlaylists', ...fields })
  return data.song
}

export async function addUser(fields) {
  if (isMockMode) return mockAddUser(fields)
  const data = await post({ action: 'addUser', ...fields })
  return data.user
}

export async function editUser(fields) {
  if (isMockMode) return mockEditUser(fields)
  const data = await post({ action: 'editUser', ...fields })
  return data.user
}

// --- Mock backend (used until APPS_SCRIPT_URL is configured) ---

// v3: meatloafs became loaf/firstTimer badge flags on comments.
const MOCK_KEY = 'fta-mock-data-v3'

const MOCK_SEED = {
  users: [
    {
      id: 'seed-u1',
      firstName: 'Sam',
      lastName: '',
      alias: 'DJ Samwise',
      createdAt: '2026-06-01T12:00:00.000Z',
    },
    {
      id: 'seed-u2',
      firstName: 'Alex',
      lastName: 'Chen',
      alias: 'DJ Loaf',
      createdAt: '2026-06-01T12:00:00.000Z',
    },
    {
      id: 'seed-u3',
      firstName: 'Jordan',
      lastName: 'Rivera',
      alias: 'Moonchild',
      createdAt: '2026-06-01T12:00:00.000Z',
    },
  ],
  songs: [
    {
      id: 'seed-1',
      song: 'Pink Pony Club',
      artist: 'Chappell Roan',
      genre: 'Pop',
      userId: 'seed-u1',
      notes: 'The key change at the end gets me every time.',
      createdAt: '2026-07-01T12:00:00.000Z',
    },
    {
      id: 'seed-2',
      song: 'Paranoid Android',
      artist: 'Radiohead',
      genre: 'Rock',
      userId: 'seed-u2',
      notes: 'Three songs in one. A classic for a reason.',
      createdAt: '2026-07-03T12:00:00.000Z',
    },
    {
      id: 'seed-3',
      song: 'Pink Moon',
      artist: 'Nick Drake',
      genre: 'Folk',
      userId: 'seed-u3',
      notes: 'Two minutes of perfect quiet.',
      createdAt: '2026-06-15T12:00:00.000Z',
    },
  ],
  comments: [
    {
      id: 'seed-c1',
      songId: 'seed-2',
      userId: 'seed-u1',
      text: 'Saw this live in 2019, unreal.',
      loaf: true,
      firstTimer: false,
      createdAt: '2026-07-04T12:00:00.000Z',
    },
    {
      id: 'seed-c2',
      songId: 'seed-1',
      userId: 'seed-u3',
      text: 'Never heard this before and now it lives in my head rent-free.',
      loaf: true,
      firstTimer: true,
      createdAt: '2026-07-05T12:00:00.000Z',
    },
  ],
  // Jun 2026 intentionally has no playlist row, to exercise the "no links" case.
  playlists: [
    {
      month: 'all',
      spotifyUrl: 'https://open.spotify.com/playlist/master-demo',
      appleMusicUrl: 'https://music.apple.com/playlist/master-demo',
    },
    {
      month: '2026-07',
      spotifyUrl: 'https://open.spotify.com/playlist/jul-demo',
      appleMusicUrl: '',
    },
  ],
}

function mockLoad() {
  try {
    const stored = localStorage.getItem(MOCK_KEY)
    // Merge with empty defaults so data saved before newer collections existed still works.
    if (stored)
      return {
        users: [],
        songs: [],
        comments: [],
        playlists: [],
        ...JSON.parse(stored),
      }
  } catch {
    // fall through to seed
  }
  return structuredClone(MOCK_SEED)
}

async function mockFetchAll() {
  await new Promise((r) => setTimeout(r, 400))
  return mockLoad()
}

async function mockAdd(collection, fields) {
  await new Promise((r) => setTimeout(r, 400))
  const data = mockLoad()
  const record = {
    ...fields,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  data[collection].push(record)
  localStorage.setItem(MOCK_KEY, JSON.stringify(data))
  return record
}

async function mockEdit(collection, { id, requester, ...fields }) {
  await new Promise((r) => setTimeout(r, 400))
  const data = mockLoad()
  const record = data[collection].find((r) => r.id === id)
  if (!record) throw new Error('Not found')
  Object.assign(record, fields)
  localStorage.setItem(MOCK_KEY, JSON.stringify(data))
  return record
}

function mockAliasTaken(data, alias, excludeId) {
  const wanted = alias.trim().toLowerCase()
  return data.users.some(
    (a) => a.id !== excludeId && a.alias.toLowerCase() === wanted
  )
}

async function mockAddUser(fields) {
  const data = mockLoad()
  if (mockAliasTaken(data, fields.alias, null)) {
    await new Promise((r) => setTimeout(r, 400))
    throw new Error('That DJ alias is already taken')
  }
  return mockAdd('users', fields)
}

async function mockEditUser({ id, ...fields }) {
  const data = mockLoad()
  if (mockAliasTaken(data, fields.alias, id)) {
    await new Promise((r) => setTimeout(r, 400))
    throw new Error('That DJ alias is already taken')
  }
  return mockEdit('users', { id, ...fields })
}

async function mockDelete(collection, { id }) {
  await new Promise((r) => setTimeout(r, 400))
  const data = mockLoad()
  data[collection] = data[collection].filter((r) => r.id !== id)
  if (collection === 'songs') {
    data.comments = data.comments.filter((c) => c.songId !== id)
  }
  localStorage.setItem(MOCK_KEY, JSON.stringify(data))
  return { ok: true, deletedId: id }
}
