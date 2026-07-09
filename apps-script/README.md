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
   - This creates the **Songs** and **Comments** tabs with headers.

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

## Notes

- "Anyone" access means anyone with the URL can read/write via the API — acceptable for a
  private friend group; the URL is only discoverable through the app.
- The sheet itself stays private to your Google account and doubles as an admin UI:
  edit or delete rows directly and the app reflects it on next load.
- Free quota is ~20,000 requests/day — orders of magnitude above this app's usage.
