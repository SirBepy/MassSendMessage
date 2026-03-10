import * as storage from './storage.js';

const state = {
  sheetUrl: '',
  nameColumn: '',
  phoneColumn: '',
  messageTemplate: '',
  headers: [],
  allRows: [],
  sheetError: null,
  spreadsheetId: '',
  sheetGid: '0',
  accessToken: null,
  statusColIndex: -1,
  timestampColIndex: -1,
  sheetTitle: '',
  userEmail: null
};

export function getState() {
  return state;
}

export function setConfig({ sheetUrl, nameColumn, phoneColumn, messageTemplate }) {
  if (sheetUrl !== undefined) state.sheetUrl = sheetUrl;
  if (nameColumn !== undefined) state.nameColumn = nameColumn;
  if (phoneColumn !== undefined) state.phoneColumn = phoneColumn;
  if (messageTemplate !== undefined) state.messageTemplate = messageTemplate;
  storage.saveConfig({
    sheetUrl: state.sheetUrl,
    nameColumn: state.nameColumn,
    phoneColumn: state.phoneColumn,
    messageTemplate: state.messageTemplate
  });
}

export function setSheetData({ headers, allRows, spreadsheetId, gid, statusColIndex, timestampColIndex, sheetTitle }) {
  state.headers = headers;
  state.allRows = allRows;
  state.spreadsheetId = spreadsheetId;
  state.sheetGid = gid;
  state.statusColIndex = statusColIndex;
  state.timestampColIndex = timestampColIndex;
  state.sheetTitle = sheetTitle ?? '';
  state.sheetError = null;
}

export function setSheetError(message) {
  state.sheetError = message;
}

export function setAccessToken(token) {
  state.accessToken = token;
}

export function setUserEmail(email) {
  state.userEmail = email;
}

export function markSent(rowIndex) {
  const row = state.allRows.find(r => r.rowIndex === rowIndex);
  if (row) {
    row.isSent = true;
    row.sentAt = new Date().toISOString();
  }
}

export function markUnsent(rowIndex) {
  const row = state.allRows.find(r => r.rowIndex === rowIndex);
  if (row) {
    row.isSent = false;
    row.sentAt = '';
  }
}

export function getValidGuests() {
  return state.allRows
    .map(row => {
      const name = row[state.nameColumn]?.trim() ?? '';
      const phone = row[state.phoneColumn]?.trim() ?? '';
      return { name, phone, rowIndex: row.rowIndex, isSent: row.isSent, sentAt: row.sentAt };
    })
    .filter(g => g.name !== '' && g.phone !== '');
}

export function getFilteredGuests() {
  return state.allRows
    .map(row => {
      const name = row[state.nameColumn]?.trim() ?? '';
      const phone = row[state.phoneColumn]?.trim() ?? '';
      const missingFields = [];
      if (name === '') missingFields.push('name');
      if (phone === '') missingFields.push('phone');
      return { name, phone, rowIndex: row.rowIndex, missingFields };
    })
    .filter(g => g.missingFields.length > 0);
}

export function loadPersistedState() {
  const config = storage.loadConfig();
  if (config !== null) {
    Object.assign(state, config);
  }
  const email = storage.loadUserEmail();
  if (email) {
    state.userEmail = email;
  }
}
