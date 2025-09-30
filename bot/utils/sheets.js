const { google } = require("googleapis");
const sheetsAuth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT),
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
const sheets = google.sheets({ version: "v4", auth: sheetsAuth });
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const RANGE = "Sheet1!A:H";

async function getRandomWord() {
  try {
    const clientSheets = await sheetsAuth.getClient();
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: RANGE, auth: clientSheets });
    const rows = res.data.values || [];
    if (!rows.length) return null;
    const dataRows = rows.filter(r => r[0] && r[1]);
    const row = dataRows[Math.floor(Math.random() * dataRows.length)];
    return { kanji: row[0] || "", hiragana: row[1] || "", romaji: row[2] || "", meaning: row[3] || "", sentenceJP: row[4] || "", sentenceHiragana: row[5] || "", sentenceRomaji: row[6] || "", sentenceMeaning: row[7] || "" };
  } catch (err) {
    console.error("🔥 Error fetching from Google Sheets:", err);
    return null;
  }
}

module.exports = { getRandomWord };
