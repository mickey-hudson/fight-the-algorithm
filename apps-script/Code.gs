/**
 * Fight the Algorithm — Google Apps Script backend.
 *
 * Bound to a Google Sheet with two tabs (created by setup()):
 *   Songs:    id | song | artist | genre | recommender | notes | createdAt
 *   Comments: id | songId | author | text | createdAt
 *
 * Deployed as a web app (Execute as: Me, Access: Anyone). See README.md.
 */

var SONGS_SHEET = 'Songs';
var COMMENTS_SHEET = 'Comments';

var SONGS_HEADERS = ['id', 'song', 'artist', 'genre', 'recommender', 'notes', 'createdAt'];
var COMMENTS_HEADERS = ['id', 'songId', 'author', 'text', 'createdAt'];

var MAX_FIELD_LENGTH = 2000;

/** Run this once from the editor to create the tabs with headers. */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet(ss, SONGS_SHEET, SONGS_HEADERS);
  ensureSheet(ss, COMMENTS_SHEET, COMMENTS_HEADERS);
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
    if (record.id) records.push(record);
  }
  return records;
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}
