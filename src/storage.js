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
