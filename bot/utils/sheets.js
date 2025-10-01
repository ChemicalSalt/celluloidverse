const { google } = require("googleapis");

function getSheetsClient(serviceAccount) {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(serviceAccount),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  return { auth, sheets };
}

module.exports = { getSheetsClient };
