# Backend setup (Google Sheet + Apps Script)

One-time setup, ~5 minutes. You'll end up with a web app URL to paste into `src/config.js`.

## 1. Create the spreadsheet

1. Go to [sheets.new](https://sheets.new) and create a blank spreadsheet.
2. Name it something like **Fight the Algorithm — Songs**.

## 2. Add the script

1. In the spreadsheet, open **Extensions → Apps Script**.
2. Delete the placeholder code in `Code.gs` and paste in the full contents of
   [`Code.gs`](./Code.gs) from this folder.
3. Save (⌘S), then in the function dropdown next to **Run**, select **`setup`** and click **Run**.
   - Grant the permissions it asks for (it's your own script accessing your own sheet).
   - This creates the **Users**, **Songs**, **Comments**, **Meatloafs**, and
     **Playlists** tabs with headers. (Safe to re-run after updating the script —
     existing data is kept.)

## 3. Deploy as a web app

1. Click **Deploy → New deployment**.
2. Click the gear next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy** and copy the **Web app URL** (ends in `/exec`).

## 4. Point the frontend at it

Paste the URL into `src/config.js`:

```js
export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/…/exec'
```

## Updating the script later

Edits to the script do **not** go live automatically. After changing code:
**Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy.**
The URL stays the same.

## Migrating name-based rows to user ids

Sheets from before the Users tab hold plain names in the Songs/Comments/Meatloafs
author columns. To convert them, after updating the script and re-running `setup()`:

1. *(Optional but recommended)* Add rows to the **Users** tab yourself for each
   person first, with their real first/last name and DJ alias. Give each row an `id`
   (any unique string works). Skip this step and the migration invents users instead
   (see below).
2. Run **`migrateToUsers`** from the function dropdown. Every name found in the three
   tabs is matched case-insensitively against Users `firstName`, `alias`, and
   `"firstName lastName"`; matched names become that user's id. Unmatched names get a
   new user with `firstName` = `alias` = the old name — people can fix their profile
   in the app afterwards.
3. Safe to re-run: cells already holding a user id are left alone.

## Maintaining playlist links

The **Playlists** tab is edited by hand, not through the app. When a new monthly
playlist is created on Spotify / Apple Music, add a row:

| month   | spotifyUrl                       | appleMusicUrl                   |
| ------- | -------------------------------- | ------------------------------- |
| 2026-07 | https://open.spotify.com/…       | https://music.apple.com/…       |
| all     | https://open.spotify.com/…       | https://music.apple.com/…       |

- `month` is `YYYY-MM`; the single `all` row is the master playlist of every song.
- Leave a URL cell blank if that platform doesn't have the playlist.
- The app picks up changes on next load — no redeploy needed.

## Notes

- "Anyone" access means anyone with the URL can read/write via the API — acceptable for a
  private friend group; the URL is only discoverable through the app.
- The sheet itself stays private to your Google account and doubles as an admin UI:
  edit or delete rows directly and the app reflects it on next load.
- Free quota is ~20,000 requests/day — orders of magnitude above this app's usage.
