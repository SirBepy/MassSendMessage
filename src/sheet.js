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
  let response;
  try {
    response = await fetch(url);
  } catch (e) {
    throw new SheetFetchError("Could not load the sheet — make sure it is shared as 'Anyone with the link can view'.");
  }

  if (!response.ok) {
    throw new SheetFetchError("Could not load the sheet — make sure it is shared as 'Anyone with the link can view'.");
  }

  const text = await response.text();
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
