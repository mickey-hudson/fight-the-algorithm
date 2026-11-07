---
name: verify
description: How to run and verify fight-the-algorithm changes in a real browser.
---

# Verifying fight-the-algorithm

## Launch

1. Temporarily blank `APPS_SCRIPT_URL` in `src/config.js` (set to `""`) so the app
   runs in **demo mode** — deterministic seeded data, no writes to the real Google
   Sheet. **Revert before commit.**
2. `npm run dev` (background). Serves the main page at `http://localhost:5173/` and
   the holiday edition at `http://localhost:5173/holiday/`.

## Drive

- Use the claude-in-chrome tools against the localhost URL.
- Skip the identity gate and reset to seed data in one shot:
  `localStorage.removeItem('fta-mock-data-v4'); localStorage.setItem('fta-user-id','seed-u1'); location.reload()`
  (seed-u1 = Sam aka DJ Samwise; or clear `fta-user-id` to exercise the picker.)
- Seed data (see `MOCK_SEED` in `src/api.js`): 3 users, 3 songs — Paranoid Android
  (Jul, 1 L.O.A.F. comment), Pink Pony Club (Jul, 1 L.O.A.F. + First Timer comment),
  Pink Moon (Jun, none) — dates fixed in 2026. Holiday page (`christmasSongs`):
  Christmas Wrapping (1 L.O.A.F. comment) and Christmas Time Is Here, both Dec 2025,
  plus a `christmas-2025` playlist row.
- Holiday submissions (and the main-page link) only show from the day after
  Thanksgiving through Dec 31. To test them at another time, run
  this before the app script loads (or stub `isHolidaySeason` in `src/months.js`
  temporarily): override `Date` so it falls in that window.
- To test volume behavior, write a custom `fta-mock-data-v4` blob to localStorage
  and reload (shape: `{ users, songs, christmasSongs, comments, playlists }`; comments carry
  boolean `loaf` / `firstTimer` badge flags — see `MOCK_SEED`).

## Cleanup

- `localStorage.removeItem('fta-mock-data-v4'); localStorage.removeItem('fta-user-id')`
- Kill the vite process, restore `src/config.js`, confirm with `git status` that
  only intended files are dirty.

## Gotchas

- Component state (selected month, view toggle) resets on reload — re-click after
  any `location.reload()`.
- Month grouping uses the viewer's local timezone (`src/months.js`).
