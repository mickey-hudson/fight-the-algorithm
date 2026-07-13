# Fight the Algorithm

Song suggestions from friends, not the feed. A small React app where a friend group
shares song recommendations and comments on each other's picks.

- **Frontend**: React + Vite, hosted on GitHub Pages
- **Backend**: Google Apps Script web app in front of a Google Sheet (free, no servers)
- **Identity**: honor system — pick yourself from the crew list (or register with your
  DJ alias) once; your user id is stored in your browser

## Features

- **DJ profiles** — first visit shows a type-ahead picker of existing users
  ("{first} {last} aka {alias}"); newcomers register with first name, optional last
  name, and a DJ alias (duplicates rejected). Songs and comments reference
  users by id, so editing your name or alias (via "edit profile" in the header) never
  orphans your stuff. Everything displays the DJ alias.
- **Song suggestions** — anyone can suggest a song (title, artist, genre, notes);
  only the person who suggested a song can edit or delete it.
- **Comments** — comment on each other's picks; same creator-only edit/delete rule.
- **Monthly crates** — a pill strip filters suggestions by month, plus an "All" view;
  genre and recommender filters within a month.
- **Comment badges** — while writing a comment you can tag it **L.O.A.F.**
  ("Listener Obsessed, Absolute Fire" — the meatloaf icon with red letters) and/or
  **First Timer** (Scuba Steve — the song was new to you). Deliberately not scores:
  badges only exist inside comments, there are no counts, sums, or rankings anywhere,
  and there is no way to "like" a song without saying something about it.
- **The Loaf Log** — a view toggle switches from suggestions to a feed of loaf
  moments ("Sam meatloafed Pink Pony Club — a first listen, no less" plus the
  comment). Newest first with a shuffle button, because order means nothing. Derived
  on the client from data already fetched — no backend involvement.
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
| Users     | id, firstName, lastName, alias, createdAt                   |
| Songs     | id, song, artist, genre, userId, notes, createdAt           |
| Comments  | id, songId, userId, text, createdAt, loaf, firstTimer       |
| Playlists | month, spotifyUrl, appleMusicUrl                            |

A **Meatloafs** tab (id, songId, userId, createdAt) may remain from the retired
per-song vote feature; the app no longer reads or writes it, but the rows are kept
as an archive.

The first three tabs are written by the app. **Playlists** is maintained by hand
(whoever curates the playlists): one row per monthly playlist with `month` as
`YYYY-MM` (e.g. `2026-07`), plus one row with `month` = `all` for the master
playlist of every song. Leave a URL cell blank if that platform has no playlist.
