const { google } = require("googleapis");
const sheetsConfig = require("../config/sheetsConfig");
const { sanitizeDynamic } = require("./sanitize");

const sheetsAuth = new google.auth.GoogleAuth({
  credentials: process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT
    ? JSON.parse(process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT)
    : undefined,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheetsClient = google.sheets({ version: "v4", auth: sheetsAuth });

async function getRandomWordFromSheet(language = "japanese") {
  try {
    const config = sheetsConfig[language];
    if (!config || !config.SPREADSHEET_ID) {
      console.warn(`[Sheets] Missing config for ${language}`);
      return null;
    }

    const authClient = await sheetsAuth.getClient();
    const res = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: config.SPREADSHEET_ID,
      range: config.SPREADSHEET_RANGE,
      auth: authClient,
    });

    const rows = res.data.values || [];
    const validRows = rows.filter(r => r[0] && r[1]);
    if (!validRows.length) return null;

    const row = validRows[Math.floor(Math.random() * validRows.length)];
    const wordData = {};

    config.FIELDS.forEach((key, i) => {
      wordData[key] = sanitizeDynamic(row[i] || "");
    });

    return wordData;
  } catch (err) {
    console.error(`[Sheets] Error fetching ${language}:`, err);
    return null;
  }
}

module.exports = { getRandomWordFromSheet };
