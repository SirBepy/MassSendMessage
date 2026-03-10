import { getValidGuests, getFilteredGuests } from './state.js'

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

export function render(state, uiState) {
  if (state.accessToken === null) {
    const errorHtml = uiState.signInError
      ? `<p class="error-msg">${escapeText(uiState.signInError)}</p>`
      : '';
    const welcomeHtml = state.userEmail
      ? `<p>Welcome back, <strong>${escapeText(state.userEmail)}</strong>! Sign in to continue.</p>`
      : `<p>Sign in with your Google account to access your guest sheet.</p>`;
    const btnLabel = state.userEmail
      ? `Continue as ${escapeText(state.userEmail)}`
      : 'Sign in with Google';
    document.querySelector('#app').innerHTML = `
      <div class="page">
        <div class="card" id="signin-card">
          <h2>🔐 Sign in</h2>
          ${welcomeHtml}
          ${errorHtml}
          <button id="google-signin-btn" class="btn btn-primary">${btnLabel}</button>
        </div>
      </div>
    `;
    return;
  }

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

  let guestListCard;
  if (columnsReady) {
    const validGuests = getValidGuests();
    const filteredGuests = getFilteredGuests();
    const sentCount = validGuests.filter(g => g.isSent).length;
    const totalValid = validGuests.length;
    const allSent = totalValid > 0 && sentCount === totalValid;

    validGuests.sort((a, b) => Number(a.isSent) - Number(b.isSent));

    const guestRows = validGuests.map(guest => {
      if (guest.isSent) {
        return `<div class="guest-row sent" style="cursor:default" data-row-index="${escapeAttr(guest.rowIndex)}">
          <span>${escapeText(guest.name)}</span>
          <span>${escapeText(guest.phone)}</span>
          <span class="badge sent">✓ Sent</span>
          <span class="unsent-action" data-row-index="${escapeAttr(guest.rowIndex)}" data-action="mark-unsent">Mark as Unsent</span>
        </div>`;
      } else {
        return `<div class="guest-row" data-row-index="${escapeAttr(guest.rowIndex)}" data-action="open-whatsapp">
          <span>${escapeText(guest.name)}</span>
          <span>${escapeText(guest.phone)}</span>
          <span class="badge">Unsent</span>
        </div>`;
      }
    }).join('');

    const filteredTogglePrefix = uiState.filteredOutExpanded ? '▼' : '▶';
    const filteredSection = uiState.filteredOutExpanded
      ? `<div id="filtered-list">${filteredGuests.map(guest => `<div class="guest-row" style="cursor:default;opacity:0.6;">
          <span>${escapeText(guest.name || '—')}</span>
          <span>${escapeText(guest.phone || '—')}</span>
          <span class="badge">${escapeText(guest.missingFields.join(', '))}</span>
        </div>`).join('')}</div>`
      : '';

    guestListCard = `
    <div id="guest-list-card" class="card">
      <h2>👥 Guest List</h2>
      <div class="progress">${sentCount} / ${totalValid} sent</div>
      <div class="next-btn-row">
        <button id="next-unsent-btn" class="btn btn-green"${(totalValid === 0 || allSent) ? ' disabled' : ''}>${totalValid === 0 ? 'No valid guests to send' : allSent ? 'All invitations sent! 🎉' : '▶ Next Unsent'}</button>
      </div>
      ${guestRows}
      <hr />
      <div class="filtered-toggle" data-action="toggle-filtered">${filteredTogglePrefix} Filtered Out People (${filteredGuests.length} rows missing data)</div>
      ${filteredSection}
    </div>
  `;
  } else {
    guestListCard = `
    <div id="guest-list-card" class="card">
      <p>Select Name and Phone columns above to see your guest list.</p>
    </div>
  `;
  }

  document.querySelector('#app').innerHTML = `
    <div class="page">
      ${setupCard}
      ${guestListCard}
    </div>
  `;
}
