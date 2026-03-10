import "./style.css";
import * as auth from "./auth.js";
import * as sheet from "./sheet.js";
import {
  getState,
  setConfig,
  setSheetData,
  setSheetError,
  setAccessToken,
  setUserEmail,
  getValidGuests,
  markSent,
  markUnsent,
  loadPersistedState,
} from "./state.js";
import { saveUserEmail } from "./storage.js";
import { render } from "./render.js";
import { buildLink } from "./whatsapp.js";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const uiState = { filteredOutExpanded: false, signInError: null };

function buildMessage(template, name) {
  return template.replaceAll("{{name}}", name);
}

function handleSessionExpiry() {
  setAccessToken(null);
  uiState.signInError = "Your session expired — please sign in again.";
  render(getState(), uiState);
  attachEvents();
}

function attachEvents() {
  document
    .querySelector("#google-signin-btn")
    ?.addEventListener("click", async () => {
      try {
        const token = await auth.requestToken();
        setAccessToken(token);
        uiState.signInError = null;

        const email = await auth.fetchUserEmail(token);
        if (email) {
          setUserEmail(email);
          saveUserEmail(email);
        }

        const { sheetUrl, nameColumn, phoneColumn } = getState();
        if (sheetUrl) {
          await autoFetchSheet(sheetUrl, token, nameColumn, phoneColumn);
        } else {
          render(getState(), uiState);
          attachEvents();
        }
      } catch {
        uiState.signInError =
          "Sign-in was cancelled or failed. Please try again.";
        render(getState(), uiState);
        attachEvents();
      }
    });

  document
    .querySelector("#load-sheet-btn")
    ?.addEventListener("click", async () => {
      const url = (document.querySelector("#sheet-url")?.value ?? "").trim();
      if (!url) {
        setSheetError("Please enter a sheet URL.");
        render(getState(), uiState);
        attachEvents();
        return;
      }

      let spreadsheetId, gid;
      try {
        ({ spreadsheetId, gid } = sheet.extractSheetId(url));
      } catch (e) {
        setSheetError(e.message);
        render(getState(), uiState);
        attachEvents();
        return;
      }

      try {
        const result = await sheet.readSheet(
          spreadsheetId,
          gid,
          auth.getToken(),
        );
        const { headers, statusColIndex, timestampColIndex } =
          await sheet.ensureStatusColumns(
            spreadsheetId,
            Number(gid),
            result.headers,
            auth.getToken(),
            result.sheetTitle,
          );
        setSheetData({
          headers,
          allRows: result.rows,
          spreadsheetId,
          gid,
          statusColIndex,
          timestampColIndex,
          sheetTitle: result.sheetTitle,
        });
        setConfig({ sheetUrl: url });
      } catch (e) {
        if (e instanceof sheet.SheetAuthError) {
          handleSessionExpiry();
          return;
        }
        setSheetError(e.message);
      }
      render(getState(), uiState);
      attachEvents();
    });

  document.querySelector("#sheet-url")?.addEventListener("input", (e) => {
    setConfig({ sheetUrl: e.target.value });
  });

  document.querySelector("#name-col")?.addEventListener("change", (e) => {
    setConfig({ nameColumn: e.target.value });
    render(getState(), uiState);
    attachEvents();
  });

  document.querySelector("#phone-col")?.addEventListener("change", (e) => {
    setConfig({ phoneColumn: e.target.value });
    render(getState(), uiState);
    attachEvents();
  });

  document
    .querySelector("#message-template")
    ?.addEventListener("input", (e) => {
      setConfig({ messageTemplate: e.target.value });
    });

  document
    .querySelector("#guest-list-card")
    ?.addEventListener("click", async (e) => {
      const actionEl = e.target.closest("[data-action]");
      if (!actionEl) return;
      const action = actionEl.dataset.action;
      const rowIndexStr =
        actionEl.dataset.rowIndex ??
        actionEl.closest("[data-row-index]")?.dataset.rowIndex;
      const rowIndex = Number(rowIndexStr);

      if (action === "open-whatsapp") {
        const guest = getValidGuests().find((g) => g.rowIndex === rowIndex);
        if (!guest || guest.isSent) return;
        const message = buildMessage(getState().messageTemplate, guest.name);
        const url = buildLink(guest.phone, message);
        window.open(url, "_blank");
        const st = getState();
        try {
          await sheet.writeStatus(
            st.spreadsheetId,
            rowIndex,
            st.statusColIndex,
            st.timestampColIndex,
            true,
            auth.getToken(),
            st.sheetTitle,
          );
          markSent(rowIndex);
          render(getState(), uiState);
          attachEvents();
        } catch (e) {
          if (e instanceof sheet.SheetAuthError) {
            handleSessionExpiry();
            return;
          }
          setSheetError(e.message);
          render(getState(), uiState);
          attachEvents();
          return;
        }
      } else if (action === "mark-unsent") {
        e.stopPropagation();
        const st = getState();
        try {
          await sheet.writeStatus(
            st.spreadsheetId,
            rowIndex,
            st.statusColIndex,
            st.timestampColIndex,
            false,
            auth.getToken(),
            st.sheetTitle,
          );
          markUnsent(rowIndex);
          render(getState(), uiState);
          attachEvents();
        } catch (e) {
          if (e instanceof sheet.SheetAuthError) {
            handleSessionExpiry();
            return;
          }
          setSheetError(e.message);
          render(getState(), uiState);
          attachEvents();
          return;
        }
      } else if (action === "toggle-filtered") {
        uiState.filteredOutExpanded = !uiState.filteredOutExpanded;
        render(getState(), uiState);
        attachEvents();
      }
    });

  document
    .querySelector("#next-unsent-btn")
    ?.addEventListener("click", async () => {
      const nextGuest = getValidGuests().find((g) => !g.isSent);
      if (!nextGuest) return;
      const message = buildMessage(getState().messageTemplate, nextGuest.name);
      const url = buildLink(nextGuest.phone, message);
      window.open(url, "_blank");
      const st = getState();
      try {
        await sheet.writeStatus(
          st.spreadsheetId,
          nextGuest.rowIndex,
          st.statusColIndex,
          st.timestampColIndex,
          true,
          auth.getToken(),
          st.sheetTitle,
        );
        markSent(nextGuest.rowIndex);
        render(getState(), uiState);
        attachEvents();
      } catch (e) {
        if (e instanceof sheet.SheetAuthError) {
          handleSessionExpiry();
          return;
        }
        setSheetError(e.message);
        render(getState(), uiState);
        attachEvents();
        return;
      }
    });
}

async function autoFetchSheet(sheetUrl, token, savedNameCol, savedPhoneCol) {
  let spreadsheetId, gid;
  try {
    ({ spreadsheetId, gid } = sheet.extractSheetId(sheetUrl));
  } catch {
    return;
  }

  try {
    const result = await sheet.readSheet(spreadsheetId, gid, token);
    const { headers, statusColIndex, timestampColIndex } =
      await sheet.ensureStatusColumns(
        spreadsheetId,
        Number(gid),
        result.headers,
        token,
        result.sheetTitle,
      );
    setSheetData({
      headers,
      allRows: result.rows,
      spreadsheetId,
      gid,
      statusColIndex,
      timestampColIndex,
      sheetTitle: result.sheetTitle,
    });
    if (savedNameCol && headers.includes(savedNameCol)) {
      setConfig({ nameColumn: savedNameCol });
    } else {
      setConfig({ nameColumn: "" });
    }
    if (savedPhoneCol && headers.includes(savedPhoneCol)) {
      setConfig({ phoneColumn: savedPhoneCol });
    } else {
      setConfig({ phoneColumn: "" });
    }
  } catch (e) {
    if (e instanceof sheet.SheetAuthError) {
      setAccessToken(null);
      uiState.signInError = "Your session expired — please sign in again.";
    } else {
      setSheetError(e.message);
    }
  }
  render(getState(), uiState);
  attachEvents();
}

async function initApp() {
  loadPersistedState();

  try {
    await auth.waitForGIS();
  } catch {
    uiState.signInError =
      "Google Sign-In could not be loaded. Please check your internet connection and refresh.";
    render(getState(), uiState);
    attachEvents();
    return;
  }

  auth.initAuth(CLIENT_ID, getState().userEmail ?? "");

  const token = await auth.silentRequestToken();
  if (token) {
    setAccessToken(token);
  }

  render(getState(), uiState);
  attachEvents();

  const { sheetUrl, nameColumn, phoneColumn } = getState();
  if (token && sheetUrl) {
    await autoFetchSheet(sheetUrl, token, nameColumn, phoneColumn);
  }
}

initApp();
