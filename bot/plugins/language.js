// plugins/language.js
const { google } = require("googleapis");
const { client } = require("../client/client");

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const RANGE = "Sheet1!A:H";

const sheetsAuth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT),
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
const sheets = google.sheets({ version: "v4", auth: sheetsAuth });

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

function formatMessage(word) {
  if (!word) return "";
  return `📖 **Word of the Day**
**Kanji:** ${word.kanji}
**Hiragana/Katakana:** ${word.hiragana}
**Romaji:** ${word.romaji}
**Meaning:** ${word.meaning}

📌 **Example Sentence**
**JP:** ${word.sentenceJP}
**Hiragana/Katakana:** ${word.sentenceHiragana}
**Romaji:** ${word.sentenceRomaji}
**English:** ${word.sentenceMeaning}`;
}

async function sendWOTDNow(guildId, plugin) {
  if (!plugin?.enabled) return;
  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return console.warn(`[WOTD] Guild not found: ${guildId}`);

    const channel = guild.channels.cache.get(plugin.channelId) ||
      (await guild.channels.fetch(plugin.channelId).catch(() => null));
    if (!channel) return console.warn(`[WOTD] Channel not found: ${plugin.channelId}`);

    const me = guild.members.me || (await guild.members.fetch(client.user.id).catch(() => null));
    if (!me || !channel.permissionsFor(me)?.has("SendMessages")) {
      return console.warn(`[WOTD] Missing send permission in ${plugin.channelId}`);
    }

    const word = await getRandomWord();
    if (!word) return console.warn(`[WOTD] No word available for guild ${guildId}`);

    await channel.send(formatMessage(word));
    console.log(`[WOTD] ✅ Sent to guild ${guildId} channel ${plugin.channelId}`);
  } catch (err) {
    console.error("[WOTD] send error:", err);
  }
}

module.exports = { sendWOTDNow };
