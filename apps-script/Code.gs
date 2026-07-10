/**
 * Fight the Algorithm — Google Apps Script backend.
 *
 * Bound to a Google Sheet with five tabs (created by setup()):
 *   Users:     id | firstName | lastName | alias | createdAt
 *   Songs:     id | song | artist | genre | userId | notes | createdAt
 *   Comments:  id | songId | userId | text | createdAt
 *   Meatloafs: id | songId | userId | createdAt
 *   Playlists: month | spotifyUrl | appleMusicUrl
 *
 * Songs, comments, and meatloafs reference their user by id, so renaming a
 * person (or changing their DJ alias) never orphans their rows. Sheets created
 * before Users existed hold plain names in those columns — run
 * migrateToUsers() once from the editor to convert them (see README.md).
 *
 * Playlists is maintained by hand, not through the app: one row per monthly
 * playlist (month = YYYY-MM, e.g. 2026-07) plus one row with month = all for
 * the master playlist. Leave a URL cell blank if that platform has no playlist.
 *
 * Deployed as a web app (Execute as: Me, Access: Anyone). See README.md.
 */

var USERS_SHEET = 'Users';
var SONGS_SHEET = 'Songs';
var COMMENTS_SHEET = 'Comments';
var MEATLOAFS_SHEET = 'Meatloafs';
var PLAYLISTS_SHEET = 'Playlists';

var USERS_HEADERS = ['id', 'firstName', 'lastName', 'alias', 'createdAt'];
var SONGS_HEADERS = ['id', 'song', 'artist', 'genre', 'userId', 'notes', 'createdAt'];
var COMMENTS_HEADERS = ['id', 'songId', 'userId', 'text', 'createdAt'];
var MEATLOAFS_HEADERS = ['id', 'songId', 'userId', 'createdAt'];
var PLAYLISTS_HEADERS = ['month', 'spotifyUrl', 'appleMusicUrl'];

var MAX_FIELD_LENGTH = 2000;

/** Run this once from the editor to create the tabs with headers. */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet(ss, USERS_SHEET, USERS_HEADERS);
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
    users: readAll(USERS_SHEET, USERS_HEADERS),
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
      case 'addUser':
        return jsonResponse(addUser(body));
      case 'editUser':
        return jsonResponse(editUser(body));
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
      case 'importLegacy':
        return jsonResponse(importLegacy(body));
      default:
        return jsonResponse({ error: 'Unknown action: ' + body.action });
    }
  } finally {
    lock.releaseLock();
  }
}

function addUser(body) {
  var missing = requireFields(body, ['firstName', 'alias']);
  if (missing) return missing;

  var taken = findUserByAlias(body.alias, null);
  if (taken) return { error: 'That DJ alias is already taken' };

  var record = {
    id: Utilities.getUuid(),
    firstName: clean(body.firstName),
    lastName: clean(body.lastName),
    alias: clean(body.alias),
    createdAt: new Date().toISOString(),
  };
  appendRecord(USERS_SHEET, USERS_HEADERS, record);
  return { user: record };
}

function editUser(body) {
  var missing = requireFields(body, ['id', 'firstName', 'alias']);
  if (missing) return missing;

  var found = findRowById(USERS_SHEET, USERS_HEADERS, body.id);
  if (!found) return { error: 'User not found' };

  var taken = findUserByAlias(body.alias, body.id);
  if (taken) return { error: 'That DJ alias is already taken' };

  var record = found.record;
  record.firstName = clean(body.firstName);
  record.lastName = clean(body.lastName);
  record.alias = clean(body.alias);
  writeRecord(found, USERS_HEADERS, record);
  return { user: record };
}

function findUserByAlias(alias, excludeId) {
  var wanted = clean(alias).toLowerCase();
  var users = readAll(USERS_SHEET, USERS_HEADERS);
  for (var i = 0; i < users.length; i++) {
    if (users[i].id !== excludeId && users[i].alias.toLowerCase() === wanted) {
      return users[i];
    }
  }
  return null;
}

function userExists(id) {
  return findRowById(USERS_SHEET, USERS_HEADERS, clean(id)) !== null;
}

function addSong(body) {
  var missing = requireFields(body, ['song', 'artist', 'userId']);
  if (missing) return missing;
  if (!userExists(body.userId)) return { error: 'Unknown user' };

  var record = {
    id: Utilities.getUuid(),
    song: clean(body.song),
    artist: clean(body.artist),
    genre: clean(body.genre),
    userId: clean(body.userId),
    notes: clean(body.notes),
    createdAt: new Date().toISOString(),
  };
  appendRecord(SONGS_SHEET, SONGS_HEADERS, record);
  return { song: record };
}

function addComment(body) {
  var missing = requireFields(body, ['songId', 'userId', 'text']);
  if (missing) return missing;
  if (!userExists(body.userId)) return { error: 'Unknown user' };

  var record = {
    id: Utilities.getUuid(),
    songId: clean(body.songId),
    userId: clean(body.userId),
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
  if (found.record.userId !== clean(body.requester)) {
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
  if (found.record.userId !== clean(body.requester)) {
    return { error: 'Only the person who suggested a song can delete it' };
  }

  found.sheet.deleteRow(found.rowIndex);
  deleteRowsBySongId(COMMENTS_SHEET, body.id);
  deleteRowsBySongId(MEATLOAFS_SHEET, body.id);
  return { ok: true, deletedId: body.id };
}

function toggleMeatloaf(body) {
  var missing = requireFields(body, ['songId', 'userId']);
  if (missing) return missing;
  if (!userExists(body.userId)) return { error: 'Unknown user' };

  var songId = clean(body.songId);
  var userId = clean(body.userId);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(MEATLOAFS_SHEET);
  if (!sheet) {
    // Tab may not exist yet on sheets created before this feature.
    ensureSheet(ss, MEATLOAFS_SHEET, MEATLOAFS_HEADERS);
    sheet = ss.getSheetByName(MEATLOAFS_SHEET);
  }

  var values = sheet.getDataRange().getValues();
  for (var r = 1; r < values.length; r++) {
    if (String(values[r][1]) === songId && String(values[r][2]) === userId) {
      sheet.deleteRow(r + 1);
      return { removed: true, songId: songId, userId: userId };
    }
  }

  var record = {
    id: Utilities.getUuid(),
    songId: songId,
    userId: userId,
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
  if (found.record.userId !== clean(body.requester)) {
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
  if (found.record.userId !== clean(body.requester)) {
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

/**
 * Bulk append for the one-time legacy CSV import (scripts/migrate-legacy.mjs).
 * Append-only and idempotent: records whose id already exists are skipped, so
 * the script can be re-run safely. Records arrive with their own ids and
 * historical createdAt values (that's the point — the app's month crates come
 * from createdAt). All userIds must exist in the Users tab.
 */
function importLegacy(body) {
  var result = {
    songs: appendLegacyRecords(SONGS_SHEET, SONGS_HEADERS, body.songs || []),
    comments: appendLegacyRecords(COMMENTS_SHEET, COMMENTS_HEADERS, body.comments || []),
  };
  return result;
}

function appendLegacyRecords(sheetName, headers, records) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet "' + sheetName + '" not found — run setup() first');

  var existingIds = {};
  readAll(sheetName, headers).forEach(function (r) {
    existingIds[r.id] = true;
  });
  var userIds = {};
  readAll(USERS_SHEET, USERS_HEADERS).forEach(function (u) {
    userIds[u.id] = true;
  });

  var rows = [];
  var skipped = 0;
  var errors = [];
  records.forEach(function (record) {
    if (!record.id || existingIds[record.id]) {
      skipped++;
      return;
    }
    if (!userIds[record.userId]) {
      errors.push('Unknown userId for record ' + record.id);
      return;
    }
    rows.push(headers.map(function (h) { return clean(record[h]); }));
    existingIds[record.id] = true;
  });

  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
  }
  return { imported: rows.length, skipped: skipped, errors: errors };
}

/**
 * One-time migration for sheets that predate the Users tab, where songs,
 * comments, and meatloafs held plain names instead of user ids.
 *
 * Run from the editor AFTER setup(). Optionally pre-create Users rows with
 * real names/aliases first — existing names are matched (case-insensitively)
 * against firstName, alias, and "firstName lastName"; anything unmatched gets
 * an user created with firstName = alias = the old name (people can fix
 * their profile in the app afterwards). Safe to re-run: cells that already
 * hold an user id are left alone.
 */
function migrateToUsers() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var users = readAll(USERS_SHEET, USERS_HEADERS);
  var userIds = {};
  var idByName = {};

  function index(user) {
    userIds[user.id] = true;
    idByName[user.firstName.toLowerCase()] = user.id;
    idByName[user.alias.toLowerCase()] = user.id;
    var full = (user.firstName + ' ' + user.lastName).trim().toLowerCase();
    idByName[full] = user.id;
  }
  users.forEach(index);

  // sheet name → 1-based column that holds the user reference
  var targets = [
    [SONGS_SHEET, 5],
    [COMMENTS_SHEET, 3],
    [MEATLOAFS_SHEET, 3],
  ];

  targets.forEach(function (target) {
    var sheet = ss.getSheetByName(target[0]);
    if (!sheet) return;
    var col = target[1];
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return;
    var range = sheet.getRange(2, col, lastRow - 1, 1);
    var values = range.getValues();
    for (var r = 0; r < values.length; r++) {
      var value = String(values[r][0]).trim();
      if (!value || userIds[value]) continue; // blank or already migrated
      var key = value.toLowerCase();
      var id = idByName[key];
      if (!id) {
        var record = {
          id: Utilities.getUuid(),
          firstName: value,
          lastName: '',
          alias: value,
          createdAt: new Date().toISOString(),
        };
        appendRecord(USERS_SHEET, USERS_HEADERS, record);
        index(record);
        id = record.id;
      }
      values[r][0] = id;
    }
    range.setValues(values);
  });
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}
