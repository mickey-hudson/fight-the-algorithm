import { currentMonthKey, isHolidaySeason, monthKey, monthLabel } from './months'

// The two pages of the app. Everything that differs between the normal monthly
// suggestions and the holiday edition lives here, so components read
// from the edition instead of branching on which page they're on.
//
// A "crate" is the unit the pill strip filters by: a month (YYYY-MM) on the
// main page, a year (YYYY) on the holiday page, or 'all' on either.

export const EDITIONS = {
  main: {
    id: 'main',
    list: undefined, // backend default: the Songs tab
    songsKey: 'songs',
    title: 'Fight the Algorithm',
    tagline: 'Songs from friends, not the feed.',
    crateKey: monthKey,
    crateLabel: monthLabel,
    // Always show the current month, even before anyone has suggested anything.
    seedCrate: () => currentMonthKey(),
    // Monthly playlists are keyed by month; 'all' is the master playlist.
    playlistKey: (crate) => crate,
    playlistLabel: (crate) => (crate === 'all' ? 'Master playlist' : `${monthLabel(crate)} playlist`),
    canSubmit: () => true,
    suggestLabel: '+ Suggest a song',
    genrePlaceholder: 'Pop, Jazz, Hyperpop…',
  },
  holiday: {
    id: 'holiday',
    list: 'christmas', // backend: the ChristmasSongs tab
    songsKey: 'christmasSongs',
    title: 'Fight the Algorithm: Holiday Edition',
    tagline: 'Songs from friends, not the mall speakers.',
    crateKey: (value) => {
      const d = new Date(value)
      return isNaN(d) ? '' : String(d.getFullYear())
    },
    crateLabel: (year) => `Christmas ${year}`,
    // Only the holiday season has a "current" crate worth showing empty.
    seedCrate: () => (isHolidaySeason() ? String(new Date().getFullYear()) : null),
    // One holiday playlist per year; there's no holiday master playlist.
    playlistKey: (crate) => (crate === 'all' ? null : `christmas-${crate}`),
    playlistLabel: (crate) => `Christmas ${crate} playlist`,
    canSubmit: () => isHolidaySeason(),
    suggestLabel: '+ Suggest a holiday song',
    genrePlaceholder: 'Classic, Jazz, Mariah…',
  },
}
