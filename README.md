# Fight the Algorithm

Song suggestions from friends, not the feed. A small React app where a friend group
shares song recommendations and comments on each other's picks.

- **Frontend**: React + Vite, hosted on GitHub Pages
- **Backend**: Google Apps Script web app in front of a Google Sheet (free, no servers)
- **Identity**: honor system — pick a name once, it's stored in your browser

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

Two tabs in the Google Sheet, which doubles as an admin UI (edit/delete rows directly):

| Tab      | Columns                                                     |
| -------- | ----------------------------------------------------------- |
| Songs    | id, song, artist, genre, recommender, notes, createdAt      |
| Comments | id, songId, author, text, createdAt                         |
