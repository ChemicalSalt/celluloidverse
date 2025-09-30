// config/sheetsConfig.js
const { google } = require("googleapis");

const sheetsAuth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT),
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets = google.sheets({ version: "v4", auth: sheetsAuth });

module.exports = { sheets, sheetsAuth, SPREADSHEET_ID: process.env.SPREADSHEET_ID, RANGE: "Sheet1!A:H" };
