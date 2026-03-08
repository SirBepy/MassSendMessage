function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeText(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function render(state) {
  const headerOptions = state.headers
    .map(
      (h) =>
        `<option value="${escapeAttr(h)}"${h === state.nameColumn ? ' selected' : ''}>${escapeText(h)}</option>`
    )
    .join('');

  const phoneOptions = state.headers
    .map(
      (h) =>
        `<option value="${escapeAttr(h)}"${h === state.phoneColumn ? ' selected' : ''}>${escapeText(h)}</option>`
    )
    .join('');

  const selectDisabled = state.headers.length === 0 ? ' disabled' : '';

  const errorDisplay = state.sheetError
    ? `style="display:block"`
    : `style="display:none"`;

  const setupCard = `
    <div class="card">
      <h2>⚙️ Setup</h2>
      <div class="field">
        <label for="sheet-url">Google Sheet URL</label>
        <input id="sheet-url" type="text" value="${escapeAttr(state.sheetUrl)}" placeholder="Paste your published sheet URL here" />
      </div>
      <div id="sheet-error" class="error-msg" ${errorDisplay}>${escapeText(state.sheetError || '')}</div>
      <button id="load-sheet-btn" class="btn btn-primary">Load Sheet</button>
      <hr />
      <div class="row-cols">
        <div class="field">
          <label for="name-col">Name Column</label>
          <select id="name-col"${selectDisabled}>
            <option value="">— select column —</option>
            ${headerOptions}
          </select>
        </div>
        <div class="field">
          <label for="phone-col">Phone Column</label>
          <select id="phone-col"${selectDisabled}>
            <option value="">— select column —</option>
            ${phoneOptions}
          </select>
        </div>
      </div>
      <div class="field">
        <label for="message-template">Message Template</label>
        <textarea id="message-template">${escapeText(state.messageTemplate)}</textarea>
      </div>
    </div>
  `;

  const columnsReady =
    state.headers.length > 0 && state.nameColumn && state.phoneColumn;

  const guestListCard = columnsReady
    ? `
    <div id="guest-list-card" class="card">
      <h2>👥 Guest List</h2>
      <p>Guest rows will appear here.</p>
    </div>
  `
    : `
    <div id="guest-list-card" class="card">
      <p>Select Name and Phone columns above to see your guest list.</p>
    </div>
  `;

  document.querySelector('#app').innerHTML = `
    <div class="page">
      ${setupCard}
      ${guestListCard}
    </div>
  `;
}
