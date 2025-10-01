const { google } = require("googleapis");

function initializeSheets() {
  const sheetsAuth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth: sheetsAuth });
  const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
  const RANGE = "Sheet1!A:H";

  return { sheets, sheetsAuth, SPREADSHEET_ID, RANGE };
}

module.exports = { initializeSheets };
