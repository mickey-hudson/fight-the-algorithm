/**
 * Fight the Algorithm — Google Apps Script backend.
 *
 * Bound to a Google Sheet with four tabs (created by setup()):
 *   Songs:     id | song | artist | genre | recommender | notes | createdAt
 *   Comments:  id | songId | author | text | createdAt
 *   Meatloafs: id | songId | voter | createdAt
 *   Playlists: month | spotifyUrl | appleMusicUrl
 *
 * Playlists is maintained by hand, not through the app: one row per monthly
 * playlist (month = YYYY-MM, e.g. 2026-07) plus one row with month = all for
 * the master playlist. Leave a URL cell blank if that platform has no playlist.
 *
 * Deployed as a web app (Execute as: Me, Access: Anyone). See README.md.
 */

var SONGS_SHEET = 'Songs';
var COMMENTS_SHEET = 'Comments';
var MEATLOAFS_SHEET = 'Meatloafs';
var PLAYLISTS_SHEET = 'Playlists';

var SONGS_HEADERS = ['id', 'song', 'artist', 'genre', 'recommender', 'notes', 'createdAt'];
var COMMENTS_HEADERS = ['id', 'songId', 'author', 'text', 'createdAt'];
var MEATLOAFS_HEADERS = ['id', 'songId', 'voter', 'createdAt'];
var PLAYLISTS_HEADERS = ['month', 'spotifyUrl', 'appleMusicUrl'];

var MAX_FIELD_LENGTH = 2000;

/** Run this once from the editor to create the tabs with headers. */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet(ss, SONGS_SHEET, SONGS_HEADERS);
  ensureSheet(ss, COMMENTS_SHEET, COMMENTS_HEADERS);
  ensureSheet(ss, MEATLOAFS_SHEET, MEATLOAFS_HEADERS);
  ensureSheet(ss, PLAYLISTS_SHEET, PLAYLISTS_HEADERS);
  // Keep month values as typed (e.g. 2026-07) — otherwise Sheets parses them as dates.
  var playlists = ss.getSheetByName(PLAYLISTS_SHEET);
  playlists.getRange('A:A').setNumberFormat('@');
}

function ensureSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function doGet() {
  return jsonResponse({
    songs: readAll(SONGS_SHEET, SONGS_HEADERS),
    comments: readAll(COMMENTS_SHEET, COMMENTS_HEADERS),
    meatloafs: readAll(MEATLOAFS_SHEET, MEATLOAFS_HEADERS),
    playlists: readAll(PLAYLISTS_SHEET, PLAYLISTS_HEADERS),
  });
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ error: 'Request body must be JSON' });
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    switch (body.action) {
      case 'addSong':
        return jsonResponse(addSong(body));
      case 'addComment':
        return jsonResponse(addComment(body));
      case 'editSong':
        return jsonResponse(editSong(body));
      case 'deleteSong':
        return jsonResponse(deleteSong(body));
      case 'editComment':
        return jsonResponse(editComment(body));
      case 'deleteComment':
        return jsonResponse(deleteComment(body));
      case 'toggleMeatloaf':
        return jsonResponse(toggleMeatloaf(body));
      default:
        return jsonResponse({ error: 'Unknown action: ' + body.action });
    }
  } finally {
    lock.releaseLock();
  }
}

function addSong(body) {
  var missing = requireFields(body, ['song', 'artist', 'recommender']);
  if (missing) return missing;

  var record = {
    id: Utilities.getUuid(),
    song: clean(body.song),
    artist: clean(body.artist),
    genre: clean(body.genre),
    recommender: clean(body.recommender),
    notes: clean(body.notes),
    createdAt: new Date().toISOString(),
  };
  appendRecord(SONGS_SHEET, SONGS_HEADERS, record);
  return { song: record };
}

function addComment(body) {
  var missing = requireFields(body, ['songId', 'author', 'text']);
  if (missing) return missing;

  var record = {
    id: Utilities.getUuid(),
    songId: clean(body.songId),
    author: clean(body.author),
    text: clean(body.text),
    createdAt: new Date().toISOString(),
  };
  appendRecord(COMMENTS_SHEET, COMMENTS_HEADERS, record);
  return { comment: record };
}

function editSong(body) {
  var missing = requireFields(body, ['id', 'requester', 'song', 'artist']);
  if (missing) return missing;

  var found = findRowById(SONGS_SHEET, SONGS_HEADERS, body.id);
  if (!found) return { error: 'Song not found' };
  if (found.record.recommender !== clean(body.requester)) {
    return { error: 'Only the person who suggested a song can edit it' };
  }

  var record = found.record;
  record.song = clean(body.song);
  record.artist = clean(body.artist);
  record.genre = clean(body.genre);
  record.notes = clean(body.notes);
  writeRecord(found, SONGS_HEADERS, record);
  return { song: record };
}

function deleteSong(body) {
  var missing = requireFields(body, ['id', 'requester']);
  if (missing) return missing;

  var found = findRowById(SONGS_SHEET, SONGS_HEADERS, body.id);
  if (!found) return { error: 'Song not found' };
  if (found.record.recommender !== clean(body.requester)) {
    return { error: 'Only the person who suggested a song can delete it' };
  }

  found.sheet.deleteRow(found.rowIndex);
  deleteRowsBySongId(COMMENTS_SHEET, body.id);
  deleteRowsBySongId(MEATLOAFS_SHEET, body.id);
  return { ok: true, deletedId: body.id };
}

function toggleMeatloaf(body) {
  var missing = requireFields(body, ['songId', 'voter']);
  if (missing) return missing;

  var songId = clean(body.songId);
  var voter = clean(body.voter);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(MEATLOAFS_SHEET);
  if (!sheet) {
    // Tab may not exist yet on sheets created before this feature.
    ensureSheet(ss, MEATLOAFS_SHEET, MEATLOAFS_HEADERS);
    sheet = ss.getSheetByName(MEATLOAFS_SHEET);
  }

  var values = sheet.getDataRange().getValues();
  for (var r = 1; r < values.length; r++) {
    if (String(values[r][1]) === songId && String(values[r][2]) === voter) {
      sheet.deleteRow(r + 1);
      return { removed: true, songId: songId, voter: voter };
    }
  }

  var record = {
    id: Utilities.getUuid(),
    songId: songId,
    voter: voter,
    createdAt: new Date().toISOString(),
  };
  appendRecord(MEATLOAFS_SHEET, MEATLOAFS_HEADERS, record);
  return { meatloaf: record };
}

function editComment(body) {
  var missing = requireFields(body, ['id', 'requester', 'text']);
  if (missing) return missing;

  var found = findRowById(COMMENTS_SHEET, COMMENTS_HEADERS, body.id);
  if (!found) return { error: 'Comment not found' };
  if (found.record.author !== clean(body.requester)) {
    return { error: 'Only the person who wrote a comment can edit it' };
  }

  var record = found.record;
  record.text = clean(body.text);
  writeRecord(found, COMMENTS_HEADERS, record);
  return { comment: record };
}

function deleteComment(body) {
  var missing = requireFields(body, ['id', 'requester']);
  if (missing) return missing;

  var found = findRowById(COMMENTS_SHEET, COMMENTS_HEADERS, body.id);
  if (!found) return { error: 'Comment not found' };
  if (found.record.author !== clean(body.requester)) {
    return { error: 'Only the person who wrote a comment can delete it' };
  }

  found.sheet.deleteRow(found.rowIndex);
  return { ok: true, deletedId: body.id };
}

function deleteRowsBySongId(sheetName, songId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return;
  var values = sheet.getDataRange().getValues();
  // Bottom-up so earlier deletions don't shift the rows still to check.
  for (var r = values.length - 1; r >= 1; r--) {
    if (String(values[r][1]) === songId) {
      sheet.deleteRow(r + 1);
    }
  }
}

function findRowById(sheetName, headers, id) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return null;
  var values = sheet.getDataRange().getValues();
  for (var r = 1; r < values.length; r++) {
    if (String(values[r][0]) === id) {
      var record = {};
      for (var c = 0; c < headers.length; c++) {
        var cell = values[r][c];
        record[headers[c]] = cell instanceof Date ? cell.toISOString() : String(cell);
      }
      return { sheet: sheet, rowIndex: r + 1, record: record };
    }
  }
  return null;
}

function writeRecord(found, headers, record) {
  found.sheet
    .getRange(found.rowIndex, 1, 1, headers.length)
    .setValues([headers.map(function (h) { return record[h]; })]);
}

function requireFields(body, fields) {
  for (var i = 0; i < fields.length; i++) {
    if (!clean(body[fields[i]])) {
      return { error: 'Missing required field: ' + fields[i] };
    }
  }
  return null;
}

function clean(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim().slice(0, MAX_FIELD_LENGTH);
}

function appendRecord(sheetName, headers, record) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet "' + sheetName + '" not found — run setup() first');
  sheet.appendRow(headers.map(function (h) { return record[h]; }));
}

function readAll(sheetName, headers) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  var records = [];
  for (var r = 1; r < values.length; r++) {
    var record = {};
    for (var c = 0; c < headers.length; c++) {
      var cell = values[r][c];
      record[headers[c]] = cell instanceof Date ? cell.toISOString() : String(cell);
    }
    // Skip blank rows: the first column (id, or month for Playlists) is required.
    if (record[headers[0]]) records.push(record);
  }
  return records;
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}
