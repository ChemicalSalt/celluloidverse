const { google } = require("googleapis");

let clientRef;

function setClient(client) { clientRef = client; }

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
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
      auth: clientSheets,
    });
    const rows = res.data.values || [];
    if (!rows.length) return null;
    const dataRows = rows.filter(r => r[0] && r[1]);
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
    console.error("[Language] Error fetching from Google Sheets:", err);
    return null;
  }
}

async function sendLanguageNow(guildId, plugin) {
  if (!plugin?.enabled) return;
  if (!clientRef) return console.error("[Language] client not set!");

  const guild = clientRef.guilds.cache.get(guildId);
  if (!guild) return console.warn(`[Language] Guild not found: ${guildId}`);

  const channel = guild.channels.cache.get(plugin.channelId) || await guild.channels.fetch(plugin.channelId).catch(() => null);
  if (!channel) return console.warn(`[Language] Channel not found: ${plugin.channelId}`);

  const word = await getRandomWord();
  if (!word) return console.warn("[Language] No word found in Google Sheets");

  const msg = `📖 **Word of the Day**
**Kanji:** ${word.kanji}
**Hiragana/Katakana:** ${word.hiragana}
**Romaji:** ${word.romaji}
**Meaning:** ${word.meaning}

📌 **Example Sentence**
**JP:** ${word.sentenceJP}
**Hiragana/Katakana:** ${word.sentenceHiragana}
**Romaji:** ${word.sentenceRomaji}
**English:** ${word.sentenceMeaning}`;

  try { await channel.send(msg); console.log(`[Language] Sent to guild ${guildId}`); } 
  catch (e) { console.error("[Language] send error:", e); }
}

module.exports = { sendLanguageNow, setClient };
