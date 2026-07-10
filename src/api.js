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
  if (isMockMode) return mockAdd('songs', fields)
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

export async function toggleMeatloaf(fields) {
  if (isMockMode) return mockToggleMeatloaf(fields)
  return post({ action: 'toggleMeatloaf', ...fields })
}

// --- Mock backend (used until APPS_SCRIPT_URL is configured) ---

const MOCK_KEY = 'fta-mock-data'

const MOCK_SEED = {
  songs: [
    {
      id: 'seed-1',
      song: 'Pink Pony Club',
      artist: 'Chappell Roan',
      genre: 'Pop',
      recommender: 'Sam',
      notes: 'The key change at the end gets me every time.',
      createdAt: '2026-07-01T12:00:00.000Z',
    },
    {
      id: 'seed-2',
      song: 'Paranoid Android',
      artist: 'Radiohead',
      genre: 'Rock',
      recommender: 'Alex',
      notes: 'Three songs in one. A classic for a reason.',
      createdAt: '2026-07-03T12:00:00.000Z',
    },
    {
      id: 'seed-3',
      song: 'Pink Moon',
      artist: 'Nick Drake',
      genre: 'Folk',
      recommender: 'Jordan',
      notes: 'Two minutes of perfect quiet.',
      createdAt: '2026-06-15T12:00:00.000Z',
    },
  ],
  comments: [
    {
      id: 'seed-c1',
      songId: 'seed-2',
      author: 'Sam',
      text: 'Saw this live in 2019, unreal.',
      createdAt: '2026-07-04T12:00:00.000Z',
    },
  ],
  meatloafs: [
    {
      id: 'seed-m1',
      songId: 'seed-2',
      voter: 'Sam',
      createdAt: '2026-07-04T12:00:00.000Z',
    },
    {
      id: 'seed-m2',
      songId: 'seed-2',
      voter: 'Jordan',
      createdAt: '2026-07-05T12:00:00.000Z',
    },
  ],
}

function mockLoad() {
  try {
    const stored = localStorage.getItem(MOCK_KEY)
    // Merge with empty defaults so data saved before newer collections existed still works.
    if (stored) return { songs: [], comments: [], meatloafs: [], ...JSON.parse(stored) }
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

async function mockToggleMeatloaf({ songId, voter }) {
  await new Promise((r) => setTimeout(r, 400))
  const data = mockLoad()
  const existing = data.meatloafs.find((m) => m.songId === songId && m.voter === voter)
  let result
  if (existing) {
    data.meatloafs = data.meatloafs.filter((m) => m !== existing)
    result = { removed: true, songId, voter }
  } else {
    const record = {
      id: crypto.randomUUID(),
      songId,
      voter,
      createdAt: new Date().toISOString(),
    }
    data.meatloafs.push(record)
    result = { meatloaf: record }
  }
  localStorage.setItem(MOCK_KEY, JSON.stringify(data))
  return result
}

async function mockDelete(collection, { id }) {
  await new Promise((r) => setTimeout(r, 400))
  const data = mockLoad()
  data[collection] = data[collection].filter((r) => r.id !== id)
  if (collection === 'songs') {
    data.comments = data.comments.filter((c) => c.songId !== id)
    data.meatloafs = data.meatloafs.filter((m) => m.songId !== id)
  }
  localStorage.setItem(MOCK_KEY, JSON.stringify(data))
  return { ok: true, deletedId: id }
}
