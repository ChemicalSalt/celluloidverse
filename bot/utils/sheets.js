const { google } = require("googleapis");
const { GOOGLE_SHEETS_SERVICE_ACCOUNT } = require("../config/sheetsConfig");

const sheetsAuth = new google.auth.GoogleAuth({
  credentials: GOOGLE_SHEETS_SERVICE_ACCOUNT,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets = google.sheets({ version: "v4", auth: sheetsAuth });

module.exports = { sheetsAuth, sheets };
