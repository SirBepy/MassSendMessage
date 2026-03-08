import './style.css'
import { getState, setConfig, setSheetData, setSheetError } from './state.js'
import { fetchAndParse } from './sheet.js'
import { render } from './render.js'

function attachEvents() {
  document.querySelector('#load-sheet-btn')?.addEventListener('click', async () => {
    const url = (document.querySelector('#sheet-url')?.value ?? '').trim()
    if (!url) {
      setSheetError('Please enter a sheet URL.')
      render(getState())
      attachEvents()
      return
    }
    setConfig({ sheetUrl: url })
    try {
      const { headers, rows } = await fetchAndParse(url)
      setSheetData({ headers, allRows: rows })
    } catch (e) {
      setSheetError(e.message)
    }
    render(getState())
    attachEvents()
  })

  document.querySelector('#sheet-url')?.addEventListener('input', (e) => {
    setConfig({ sheetUrl: e.target.value })
  })

  document.querySelector('#name-col')?.addEventListener('change', (e) => {
    setConfig({ nameColumn: e.target.value })
    render(getState())
    attachEvents()
  })

  document.querySelector('#phone-col')?.addEventListener('change', (e) => {
    setConfig({ phoneColumn: e.target.value })
    render(getState())
    attachEvents()
  })

  document.querySelector('#message-template')?.addEventListener('input', (e) => {
    setConfig({ messageTemplate: e.target.value })
  })
}

render(getState())
attachEvents()
