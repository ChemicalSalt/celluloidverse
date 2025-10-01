async function getRandomWord(client) {
  try {
    const sheetsAuth = client.sheets._options.auth;
    const clientSheets = await sheetsAuth.getClient();

    const res = await client.sheets.spreadsheets.values.get({
      spreadsheetId: client.SPREADSHEET_ID,
      range: client.RANGE,
      auth: clientSheets,
    });

    const rows = res.data.values || [];
    if (!rows.length) return null;

    const dataRows = rows.filter((r) => r[0] && r[1]);
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
    console.error("🔥 Error fetching from Google Sheets:", err);
    return null;
  }
}

module.exports = { getRandomWord };
