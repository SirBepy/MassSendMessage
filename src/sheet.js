export class SheetFetchError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SheetFetchError';
  }
}

export class SheetParseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SheetParseError';
  }
}

function normalizeSheetUrl(url) {
  if (url.includes('/export') && url.includes('format=csv')) {
    return url;
  }

  try {
    const parsed = new URL(url);
    const pathMatch = parsed.pathname.match(/\/spreadsheets\/d\/([^/]+)\//);
    if (parsed.hostname === 'docs.google.com' && pathMatch) {
      const id = pathMatch[1];
      const gid = parsed.searchParams.get('gid') || parsed.hash.match(/gid=(\d+)/)?.[1] || '0';
      return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
    }
  } catch {
    // invalid URL, fall through
  }

  return url;
}

function parseCSV(text) {
  const rows = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const cells = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        cells.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    cells.push(current);

    if (cells.every(c => c === '')) continue;
    rows.push(cells);
  }

  return rows;
}

export async function fetchAndParse(url) {
  const fetchUrl = normalizeSheetUrl(url);
  let response;
  try {
    response = await fetch(fetchUrl);
  } catch {
    if (!navigator.onLine) {
      throw new SheetFetchError("Could not reach the sheet. Check your internet connection.");
    }
    throw new SheetFetchError("Could not load the sheet — make sure it is shared as 'Anyone with the link can view'.");
  }

  if (!response.ok) {
    throw new SheetFetchError("Could not load the sheet — make sure it is shared as 'Anyone with the link can view'.");
  }

  const text = await response.text();

  const contentType = response.headers.get('content-type') || '';
  const trimmed = text.trimStart().toLowerCase();
  if (contentType.includes('text/html') || trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html')) {
    throw new SheetFetchError("The sheet link did not return CSV data. Make sure the sheet is shared as 'Anyone with the link can view' and that the link is a valid Google Sheets URL.");
  }

  const parsed = parseCSV(text);

  if (parsed.length === 0) {
    throw new SheetParseError("The sheet appears to be empty or has no headers.");
  }

  const headers = parsed[0];

  if (headers.length === 0) {
    throw new SheetParseError("The sheet appears to be empty or has no headers.");
  }

  const rows = parsed.slice(1).map(cells => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = cells[i] ?? '';
    });
    return obj;
  });

  return { headers, rows };
}
