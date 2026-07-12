// Web app URL from deploying apps-script/Code.gs (see apps-script/README.md).
// Leave empty to run in local mock mode (data persisted to localStorage only).
export const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbznimTA_Ej3TOELdYGmzxXXCOx-AkN0cXNNszAlmpfRVrsEMoxZGNjK9Lkd1n-1Q4P1/exec";

// Chuck curates the Spotify / Apple Music playlists; signing in as him unlocks
// the admin-only "in playlists" toggle on song cards. Identity is honor system,
// same as the rest of the app. Must match ADMIN_USER_ID in apps-script/Code.gs.
export const ADMIN_USER_IDS = [
  '70327eee-132f-4381-8aac-aaec1effa461',
  'seed-u1', // mock-mode Sam, so the admin UI is testable without a backend
];
