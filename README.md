<!-- TODO: one day consider stylized SVG title headers instead of plain markdown headings -->

<img src="assets/images/favicon.png" width="48" alt="project icon" />

# MassSendMessage

> Bulk WhatsApp message sender that reads a guest list from Google Sheets and opens personalized WhatsApp Web links for each guest.

![Deploy](https://github.com/SirBepy/MassSendMessage/actions/workflows/deploy.yml/badge.svg) ![Last Commit](https://img.shields.io/github/last-commit/SirBepy/MassSendMessage) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black) ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)

**Live:** https://sirbepy.github.io/MassSendMessage/

---

## About

A tool for sending personalized WhatsApp messages to a list of guests pulled from a Google Sheet. Built for wedding invitations but works for any bulk messaging scenario.

Sign in with Google, paste a sheet URL, pick name and phone columns, write a message template with `{{name}}` placeholders, and send one by one via WhatsApp Web. Tracks sent/unsent status directly in the sheet.

---

## How to run

```bash
npm install
npm run dev
```

Requires a `VITE_GOOGLE_CLIENT_ID` environment variable with a valid Google OAuth client ID.

---

## Project write-up

See [PORTFOLIO.md](.portfolio-data/PORTFOLIO.md) for the full project write-up.
