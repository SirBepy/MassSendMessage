## The What

A web tool for sending personalized WhatsApp messages to a large guest list. You sign in with Google, paste a Google Sheet URL containing names and phone numbers, write a message template with `{{name}}` placeholders, and the app opens WhatsApp Web links for each guest one by one.

The app tracks sent/unsent status directly in the Google Sheet by adding status and timestamp columns, so you can pause and resume across sessions without losing progress.

## The Why

Built for sending wedding invitations via WhatsApp. Manually copying names, opening WhatsApp Web, and pasting messages for 100+ guests is tedious and error-prone. No existing tool handled the specific workflow of reading from a shared Google Sheet while tracking delivery status back into the same sheet.

## The How

The app uses Google Identity Services for OAuth and the Sheets API for both reading guest data and writing status updates. A key challenge was managing session expiry gracefully, since long sending sessions can outlast the OAuth token. The app detects expired tokens mid-operation and prompts re-authentication without losing the current guest list state.

Column detection is automatic: the app adds "Sent Status" and "Sent Timestamp" columns to the sheet if they don't exist, and uses them to track which messages have been sent.
