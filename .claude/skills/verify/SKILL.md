---
name: verify
description: How to run and verify fight-the-algorithm changes in a real browser.
---

# Verifying fight-the-algorithm

## Launch

1. Temporarily blank `APPS_SCRIPT_URL` in `src/config.js` (set to `""`) so the app
   runs in **demo mode** — deterministic seeded data, no writes to the real Google
   Sheet. **Revert before commit.**
2. `npm run dev` (background). Serves at `http://localhost:5173/fight-the-algorithm/`
   — note the `/fight-the-algorithm/` base path; the bare root 404s.

## Drive

- Use the claude-in-chrome tools against the localhost URL.
- Skip the identity gate and reset to seed data in one shot:
  `localStorage.removeItem('fta-mock-data-v3'); localStorage.setItem('fta-user-id','seed-u1'); location.reload()`
  (seed-u1 = Sam aka DJ Samwise; or clear `fta-user-id` to exercise the picker.)
- Seed data (see `MOCK_SEED` in `src/api.js`): 3 users, 3 songs — Paranoid Android
  (Jul, 1 L.O.A.F. comment), Pink Pony Club (Jul, 1 L.O.A.F. + First Timer comment),
  Pink Moon (Jun, none) — dates fixed in 2026.
- To test volume behavior, write a custom `fta-mock-data-v3` blob to localStorage
  and reload (shape: `{ users, songs, comments, playlists }`; comments carry
  boolean `loaf` / `firstTimer` badge flags — see `MOCK_SEED`).

## Cleanup

- `localStorage.removeItem('fta-mock-data-v3'); localStorage.removeItem('fta-user-id')`
- Kill the vite process, restore `src/config.js`, confirm with `git status` that
  only intended files are dirty.

## Gotchas

- Component state (selected month, view toggle) resets on reload — re-click after
  any `location.reload()`.
- Month grouping uses the viewer's local timezone (`src/months.js`).
