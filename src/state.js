import * as storage from './storage.js';

const state = {
  sheetUrl: '',
  nameColumn: '',
  phoneColumn: '',
  messageTemplate: '',
  headers: [],
  allRows: [],
  sheetError: null,
  sentKeys: []
};

function makeKey(name, phone) {
  return name.trim().toLowerCase() + '|' + phone.trim().toLowerCase();
}

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

export function setSheetData({ headers, allRows }) {
  state.headers = headers;
  state.allRows = allRows;
  state.sheetError = null;
}

export function setSheetError(message) {
  state.sheetError = message;
}

export function markSent(key) {
  if (!state.sentKeys.includes(key)) {
    state.sentKeys.push(key);
  }
  storage.saveSentKeys(state.sentKeys);
}

export function markUnsent(key) {
  state.sentKeys = state.sentKeys.filter(k => k !== key);
  storage.saveSentKeys(state.sentKeys);
}

export function isSent(key) {
  return state.sentKeys.includes(key);
}

export function getValidGuests() {
  return state.allRows
    .map(row => {
      const name = row[state.nameColumn]?.trim() ?? '';
      const phone = row[state.phoneColumn]?.trim() ?? '';
      const isValid = name !== '' && phone !== '';
      const missingFields = [];
      if (name === '') missingFields.push('name');
      if (phone === '') missingFields.push('phone');
      const key = makeKey(name, phone);
      return { name, phone, isValid, missingFields, key };
    })
    .filter(g => g.isValid === true);
}

export function getFilteredGuests() {
  return state.allRows
    .map(row => {
      const name = row[state.nameColumn]?.trim() ?? '';
      const phone = row[state.phoneColumn]?.trim() ?? '';
      const isValid = name !== '' && phone !== '';
      const missingFields = [];
      if (name === '') missingFields.push('name');
      if (phone === '') missingFields.push('phone');
      const key = makeKey(name, phone);
      return { name, phone, isValid, missingFields, key };
    })
    .filter(g => g.isValid === false);
}

export function loadPersistedState() {
  const config = storage.loadConfig();
  if (config !== null) {
    Object.assign(state, config);
  }
  const loadedKeys = storage.loadSentKeys();
  state.sentKeys = Array.isArray(loadedKeys) ? loadedKeys : [];
}
