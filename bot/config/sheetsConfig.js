// config/sheetsConfig.js
const { google } = require("googleapis");

let sheetsClient = null;

try {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT || "{}"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  sheetsClient = google.sheets({ version: "v4", auth });
} catch (e) {
  console.error("🔥 Failed to init Google Sheets client:", e);
}

module.exports = {
  sheetsClient,
};
