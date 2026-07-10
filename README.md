# Fight the Algorithm

Song suggestions from friends, not the feed. A small React app where a friend group
shares song recommendations and comments on each other's picks.

- **Frontend**: React + Vite, hosted on GitHub Pages
- **Backend**: Google Apps Script web app in front of a Google Sheet (free, no servers)
- **Identity**: honor system — pick a name once, it's stored in your browser

## Features

- **Song suggestions** — anyone can suggest a song (title, artist, genre, notes);
  only the person who suggested a song can edit or delete it.
- **Comments** — comment on each other's picks; same creator-only edit/delete rule.
- **Monthly crates** — a pill strip filters suggestions by month, plus an "All" view;
  genre and recommender filters within a month.
- **Meatloafs** — like a song by giving it a meatloaf (one per person per song,
  toggle to take it back). The count and who gave them show on each card.
- **LOAF lists** — LOAF (Listener Obsession, Absolute Fire): a view toggle switches
  from suggestions to a leaderboard of meatloaf-ed songs. Each month gets an uncapped
  ranked list; the "All" pill shows the all-time Top 10, ties broken by most recent
  meatloaf. Derived on the client from data already fetched — no backend involvement.
- **Playlist links** — a links row under the month pills points to that month's
  Spotify / Apple Music playlist ("All" shows the master playlist). Links live in the
  hand-maintained **Playlists** sheet tab; months without a row simply show no links.

## Local development

```sh
npm install
npm run dev
```

With no backend configured (`APPS_SCRIPT_URL` empty in `src/config.js`), the app runs in
**demo mode**: seeded sample data, changes persist only to your browser's localStorage.

## Setup

1. **Backend** — follow [`apps-script/README.md`](apps-script/README.md) to create the
   Google Sheet, deploy the Apps Script web app, and paste its URL into `src/config.js`.
2. **Hosting** — in the GitHub repo settings, under **Pages**, set the source to
   **GitHub Actions**. Every push to `main` then builds and deploys via
   [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

> The Vite `base` in `vite.config.js` is `/fight-the-algorithm/`. If you rename the repo,
> update it to match.

## How data is stored

Four tabs in the Google Sheet, which doubles as an admin UI (edit/delete rows directly):

| Tab       | Columns                                                     |
| --------- | ----------------------------------------------------------- |
| Songs     | id, song, artist, genre, recommender, notes, createdAt      |
| Comments  | id, songId, author, text, createdAt                         |
| Meatloafs | id, songId, voter, createdAt                                |
| Playlists | month, spotifyUrl, appleMusicUrl                            |

The first three tabs are written by the app. **Playlists** is maintained by hand
(whoever curates the playlists): one row per monthly playlist with `month` as
`YYYY-MM` (e.g. `2026-07`), plus one row with `month` = `all` for the master
playlist of every song. Leave a URL cell blank if that platform has no playlist.
