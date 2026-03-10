export class SheetApiError extends Error {
  constructor(message) {
    super(message);
    this.name = "SheetApiError";
  }
}

export class SheetAuthError extends Error {
  constructor(message) {
    super(message);
    this.name = "SheetAuthError";
  }
}

function colIndexToLetter(index) {
  let letter = "";
  let n = index;
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter;
    n = Math.floor(n / 26) - 1;
  }
  return letter;
}

export function extractSheetId(url) {
  const parsed = new URL(url);
  const pathMatch = parsed.pathname.match(/\/spreadsheets\/d\/([^/]+)/);
  if (!pathMatch) {
    throw new Error(
      "Invalid Google Sheets URL — could not extract spreadsheet ID.",
    );
  }
  const spreadsheetId = pathMatch[1];
  const gid =
    parsed.searchParams.get("gid") ??
    parsed.hash.match(/gid=(\d+)/)?.[1] ??
    "0";
  return { spreadsheetId, gid };
}

async function handleResponse(response) {
  if (response.status === 401 || response.status === 403) {
    throw new SheetAuthError("Authentication failed — please sign in again.");
  }
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new SheetApiError(`Sheets API error ${response.status}: ${text}`);
  }
  return response.json();
}

export async function readSheet(spreadsheetId, gid, token) {
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const meta = await handleResponse(metaRes);

  let sheetTitle;
  const sheets = meta.sheets ?? [];
  const matched = sheets.find((s) => s.properties.sheetId === Number(gid));
  if (matched) {
    sheetTitle = matched.properties.title;
  } else if (gid === "0" && sheets.length > 0) {
    sheetTitle = sheets[0].properties.title;
  } else {
    throw new SheetApiError("Could not find the specified sheet tab.");
  }

  const valRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const valData = await handleResponse(valRes);

  const values = valData.values ?? [];
  if (values.length === 0) {
    throw new SheetApiError("The sheet appears to be empty or has no headers.");
  }

  const headers = values[0];
  const statusColIdx = headers.indexOf("Invite Status");
  const tsColIdx = headers.indexOf("Sent At");

  const rows = values.slice(1).map((row, i) => {
    const rawValues = {};
    headers.forEach((h, hi) => {
      rawValues[h] = row[hi] ?? "";
    });
    return {
      rowIndex: i + 2,
      isSent: row[statusColIdx] === "Sent",
      sentAt: row[tsColIdx] ?? "",
      ...rawValues,
    };
  });

  return { headers, rows, sheetTitle };
}

export async function ensureStatusColumns(
  spreadsheetId,
  sheetId,
  headers,
  token,
  sheetTitle,
) {
  if (!sheetTitle) {
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const meta = await handleResponse(metaRes);
    const sheets = meta.sheets ?? [];
    const matched = sheets.find(
      (s) => s.properties.sheetId === Number(sheetId),
    );
    if (matched) {
      sheetTitle = matched.properties.title;
    } else if (sheetId === 0 && sheets.length > 0) {
      sheetTitle = sheets[0].properties.title;
    } else {
      throw new SheetApiError(
        "Could not resolve sheet tab title from the provided sheet ID.",
      );
    }
  }

  const missing = [];
  if (!headers.includes("Invite Status")) missing.push("Invite Status");
  if (!headers.includes("Sent At")) missing.push("Sent At");

  let currentHeaders = [...headers];

  for (const label of missing) {
    const colLetter = colIndexToLetter(currentHeaders.length);
    const range = `${sheetTitle}!${colLetter}1`;
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: [[label]] }),
      },
    );
    if (res.status === 401 || res.status === 403) {
      throw new SheetAuthError("Authentication failed — please sign in again.");
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new SheetApiError(`Sheets API error ${res.status}: ${text}`);
    }
    currentHeaders.push(label);
  }

  const statusColIndex = currentHeaders.indexOf("Invite Status");
  const timestampColIndex = currentHeaders.indexOf("Sent At");

  return { headers: currentHeaders, statusColIndex, timestampColIndex };
}

export async function writeStatus(
  spreadsheetId,
  rowIndex,
  statusColIndex,
  timestampColIndex,
  sent,
  token,
  sheetTitle = "",
) {
  const statusLetter = colIndexToLetter(statusColIndex);
  const tsLetter = colIndexToLetter(timestampColIndex);
  const prefix = sheetTitle ? `${sheetTitle}!` : "";
  const range = `${prefix}${statusLetter}${rowIndex}:${tsLetter}${rowIndex}`;
  const values = sent ? [["Sent", new Date().toISOString()]] : [["", ""]];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values }),
    },
  );

  if (res.status === 401 || res.status === 403) {
    throw new SheetAuthError("Authentication failed — please sign in again.");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new SheetApiError(`Sheets API error ${res.status}: ${text}`);
  }
}
