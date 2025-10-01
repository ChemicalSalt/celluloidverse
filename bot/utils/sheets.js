// utils/sheets.js
const { google } = require("googleapis");
const sheetsConfig = require("../config/sheetsConfig");

if (!process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT) {
  console.warn("GOOGLE_SHEETS_SERVICE_ACCOUNT not set; WOTD will be disabled without it.");
}

const sheetsAuth = new google.auth.GoogleAuth({
  credentials: process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT
    ? JSON.parse(process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT)
    : undefined,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheetsClient = google.sheets({ version: "v4", auth: sheetsAuth });

async function getRandomWordFromSheet() {
  try {
    if (!sheetsConfig.SPREADSHEET_ID) {
      console.warn("SPREADSHEET_ID not set; cannot fetch WOTD.");
      return null;
    }
    const authClient = await sheetsAuth.getClient();
    const res = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: sheetsConfig.SPREADSHEET_ID,
      range: sheetsConfig.SPREADSHEET_RANGE,
      auth: authClient,
    });
    const rows = res.data.values || [];
    const dataRows = rows.filter((r) => r[0] && r[1]); // kanji + hiragana required
    if (!dataRows.length) return null;
    const row = dataRows[Math.floor(Math.random() * dataRows.length)];
    return {
      kanji: row[0] || "",
      hiragana: row[1] || "",
      romaji: row[2] || "",
      meaning: row[3] || "",
      sentenceJP: row[4] || "",
      sentenceHiragana: row[5] || "",
      sentenceRomaji: row[6] || "",
      sentenceMeaning: row[7] || "",
    };
  } catch (err) {
    console.error("Error fetching sheet:", err);
    return null;
  }
}

module.exports = { getRandomWordFromSheet };
