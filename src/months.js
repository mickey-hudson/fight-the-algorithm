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

// The holiday season runs from the day after US Thanksgiving (the fourth
// Thursday of November) through December 31. Must match holidaySeasonStart()
// in apps-script/Code.gs.
export function holidaySeasonStart(year) {
  const nov1 = new Date(year, 10, 1).getDay()
  const thanksgiving = 1 + ((4 - nov1 + 7) % 7) + 21
  return new Date(year, 10, thanksgiving + 1)
}

export function isHolidaySeason(now = new Date()) {
  return now >= holidaySeasonStart(now.getFullYear())
}

// Sheets sometimes turns a typed "2026-07" into a real date, which the backend
// serializes as an ISO string — normalize either form to a month key.
// Holiday playlist keys (christmas-YYYY) pass through as-is.
export function normalizeMonth(value) {
  const v = String(value || '').trim()
  if (v.toLowerCase() === 'all') return 'all'
  if (/^christmas-\d{4}$/i.test(v)) return v.toLowerCase()
  if (/^\d{4}-\d{2}$/.test(v)) return v
  return monthKey(v)
}
