// Month grouping uses the viewer's local timezone — the friend group shares one.

export function monthKey(value) {
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d)) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(key) {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  })
}

export function currentMonthKey() {
  return monthKey(new Date())
}

// Sheets sometimes turns a typed "2026-07" into a real date, which the backend
// serializes as an ISO string — normalize either form to a month key.
export function normalizeMonth(value) {
  const v = String(value || '').trim()
  if (v.toLowerCase() === 'all') return 'all'
  if (/^\d{4}-\d{2}$/.test(v)) return v
  return monthKey(v)
}
