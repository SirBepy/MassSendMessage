export function saveConfig(config) {
  try {
    const { sheetUrl, nameColumn, phoneColumn, messageTemplate } = config;
    localStorage.setItem('wis_config', JSON.stringify({ sheetUrl, nameColumn, phoneColumn, messageTemplate }));
  } catch (e) {}
}

export function loadConfig() {
  try {
    const item = localStorage.getItem('wis_config');
    if (item === null) return null;
    return JSON.parse(item);
  } catch (e) {
    return null;
  }
}

export function saveSentKeys(keys) {
  try {
    localStorage.setItem('wis_sent_keys', JSON.stringify(keys));
  } catch (e) {}
}

export function loadSentKeys() {
  try {
    const item = localStorage.getItem('wis_sent_keys');
    if (item === null) return [];
    const parsed = JSON.parse(item);
    if (Array.isArray(parsed) && parsed.every(v => typeof v === 'string')) {
      return parsed;
    }
    return [];
  } catch (e) {
    return [];
  }
}
