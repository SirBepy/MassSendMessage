import './style.css'
import { getState, setConfig, setSheetData, setSheetError, getValidGuests, markSent, markUnsent, isSent, loadPersistedState } from './state.js'
import { fetchAndParse } from './sheet.js'
import { render } from './render.js'
import { buildLink } from './whatsapp.js'

const uiState = { filteredOutExpanded: false }
let activeRequestId = 0

function buildMessage(template, name) {
  return template.replaceAll('{{name}}', name)
}

function attachEvents() {
  document.querySelector('#load-sheet-btn')?.addEventListener('click', async () => {
    const url = (document.querySelector('#sheet-url')?.value ?? '').trim()
    if (!url) {
      setSheetError('Please enter a sheet URL.')
      render(getState(), uiState)
      attachEvents()
      return
    }
    setConfig({ sheetUrl: url })
    const requestId = ++activeRequestId
    try {
      const { headers, rows } = await fetchAndParse(url)
      if (requestId !== activeRequestId) return
      setSheetData({ headers, allRows: rows })
    } catch (e) {
      if (requestId !== activeRequestId) return
      setSheetError(e.message)
    }
    render(getState(), uiState)
    attachEvents()
  })

  document.querySelector('#sheet-url')?.addEventListener('input', (e) => {
    setConfig({ sheetUrl: e.target.value })
  })

  document.querySelector('#name-col')?.addEventListener('change', (e) => {
    setConfig({ nameColumn: e.target.value })
    render(getState(), uiState)
    attachEvents()
  })

  document.querySelector('#phone-col')?.addEventListener('change', (e) => {
    setConfig({ phoneColumn: e.target.value })
    render(getState(), uiState)
    attachEvents()
  })

  document.querySelector('#message-template')?.addEventListener('input', (e) => {
    setConfig({ messageTemplate: e.target.value })
  })

  document.querySelector('#guest-list-card')?.addEventListener('click', (e) => {
    const actionEl = e.target.closest('[data-action]')
    if (!actionEl) return
    const action = actionEl.dataset.action
    const key = actionEl.dataset.key ?? actionEl.closest('[data-key]')?.dataset.key

    if (action === 'open-whatsapp') {
      const guest = getValidGuests().find(g => g.key === key)
      if (!guest || isSent(key)) return
      const message = buildMessage(getState().messageTemplate, guest.name)
      const url = buildLink(guest.phone, message)
      window.open(url, '_blank')
      markSent(key)
      render(getState(), uiState)
      attachEvents()
    } else if (action === 'mark-unsent') {
      e.stopPropagation()
      markUnsent(key)
      render(getState(), uiState)
      attachEvents()
    } else if (action === 'toggle-filtered') {
      uiState.filteredOutExpanded = !uiState.filteredOutExpanded
      render(getState(), uiState)
      attachEvents()
    }
  })

  document.querySelector('#next-unsent-btn')?.addEventListener('click', () => {
    const nextGuest = getValidGuests().find(g => !isSent(g.key))
    if (!nextGuest) return
    const message = buildMessage(getState().messageTemplate, nextGuest.name)
    const url = buildLink(nextGuest.phone, message)
    window.open(url, '_blank')
    markSent(nextGuest.key)
    render(getState(), uiState)
    attachEvents()
  })
}

async function initApp() {
  loadPersistedState()

  render(getState(), uiState)
  attachEvents()

  const sheetUrl = getState().sheetUrl
  if (sheetUrl) {
    const requestId = ++activeRequestId
    try {
      const { headers, rows } = await fetchAndParse(sheetUrl)
      if (requestId !== activeRequestId) return
      setSheetData({ headers, allRows: rows })
      const { nameColumn, phoneColumn } = getState()
      if (nameColumn && !headers.includes(nameColumn)) setConfig({ nameColumn: '' })
      if (phoneColumn && !headers.includes(phoneColumn)) setConfig({ phoneColumn: '' })
    } catch (e) {
      if (requestId !== activeRequestId) return
      setSheetError(e.message)
    }
    render(getState(), uiState)
    attachEvents()
  }
}

initApp()
