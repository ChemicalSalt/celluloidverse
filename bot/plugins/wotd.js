const cron = require("node-cron");
const { google } = require("googleapis");
const { db } = require("../utils/firestore");
const { cleanChannelId, formatMessage } = require("../utils/helpers");
const { SPREADSHEET_ID, GOOGLE_SHEETS_SERVICE_ACCOUNT } = require("../config/sheetsConfig");

const sheetsAuth = new google.auth.GoogleAuth({
  credentials: GOOGLE_SHEETS_SERVICE_ACCOUNT,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
const sheets = google.sheets({ version: "v4", auth: sheetsAuth });

const scheduledJobs = new Map();

async function getRandomWord() {
  try {
    const clientSheets = await sheetsAuth.getClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A:H",
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
    console.error("🔥 Error fetching from Google Sheets:", err);
    return null;
  }
}

function scheduleWordOfTheDay(client, guildId, plugin) {
  const key = `wotd:${guildId}`;
  if (!plugin || !plugin.enabled || !plugin.channelId || !plugin.time) {
    if (scheduledJobs.has(key)) {
      scheduledJobs.get(key).stop();
      scheduledJobs.delete(key);
      console.log(`[WOTD] ❌ Stopped schedule for guild ${guildId}`);
    }
    return;
  }

  const parts = (plugin.time || "").split(":").map(s => Number(s));
  if (parts.length !== 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) {
    return console.error(`[WOTD] ⚠ Invalid time for guild ${guildId}:`, plugin.time);
  }
  const [hour, minute] = parts;

  if (scheduledJobs.has(key)) {
    scheduledJobs.get(key).stop();
    scheduledJobs.delete(key);
  }

  try {
    const expr = `${minute} ${hour} * * *`; // daily at UTC hour:minute
    const job = cron.schedule(expr, async () => {
      console.log(`[WOTD] ⚡ Triggering send for guild ${guildId} at ${plugin.time} UTC`);
      try {
        await sendWOTDNow(client, guildId, plugin);
      } catch (e) {
        console.error("[WOTD] send error:", e);
      }
    }, { timezone: "UTC" });
    scheduledJobs.set(key, job);
    console.log(`[WOTD] ✅ Scheduled for guild ${guildId} at ${plugin.time} UTC (key=${key})`);
  } catch (err) {
    console.error("🔥 Failed to schedule WOTD:", err);
  }
}

async function sendWOTDNow(client, guildId, plugin) {
  if (!plugin?.enabled) return;
  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return console.warn(`[WOTD] Guild not found in cache: ${guildId}`);

    const channel = guild.channels.cache.get(plugin.channelId)
      || await guild.channels.fetch(plugin.channelId).catch(() => null);
    if (!channel) return console.warn(`[WOTD] Channel not found: ${plugin.channelId}`);

    const me = guild.members.me || await guild.members.fetch(client.user.id).catch(() => null);
    if (!me || !channel.permissionsFor(me)?.has("SendMessages")) {
      return console.warn(`[WOTD] Missing send permission in ${plugin.channelId}`);
    }

    const word = await getRandomWord();
    if (!word) return console.warn(`[WOTD] No word available`);

    const message =
      `📖 **Word of the Day**
**Kanji:** ${word.kanji}
**Hiragana/Katakana:** ${word.hiragana}
**Romaji:** ${word.romaji}
**Meaning:** ${word.meaning}

📌 **Example Sentence**
**JP:** ${word.sentenceJP}
**Hiragana/Katakana:** ${word.sentenceHiragana}
**Romaji:** ${word.sentenceRomaji}
**English:** ${word.sentenceMeaning}`;

    await channel.send(message);
    console.log(`[WOTD] ✅ Sent to guild ${guildId} channel ${plugin.channelId}`);
  } catch (err) {
    console.error("🔥 Error sending WOTD:", err);
  }
}

module.exports = {
  scheduleWordOfTheDay,
  sendWOTDNow,
};
