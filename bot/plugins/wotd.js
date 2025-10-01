const cron = require("node-cron");
const { getSheetsClient } = require("../utils/sheets");
const { SPREADSHEET_ID, RANGE } = require("../config/sheetsConfig");

const scheduledJobs = new Map();

async function getRandomWord() {
  try {
    const sheets = await getSheetsClient();
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: RANGE });
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
    console.error("🔥 Sheets error:", err);
    return null;
  }
}

async function sendWOTDNow(client, guildId, plugin) {
  if (!plugin?.enabled) return;
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return;

  const channel = guild.channels.cache.get(plugin.channelId) ||
    (await guild.channels.fetch(plugin.channelId).catch(() => null));
  if (!channel) return;

  const me = guild.members.me || (await guild.members.fetch(client.user.id).catch(() => null));
  if (!me || !channel.permissionsFor(me)?.has("SendMessages")) return;

  const word = await getRandomWord();
  if (!word) return;

  const message = `📖 **Word of the Day**
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
}

function scheduleWordOfTheDay(client, guildId, plugin) {
  const key = `wotd:${guildId}`;
  if (!plugin || !plugin.enabled || !plugin.channelId || !plugin.time) {
    if (scheduledJobs.has(key)) {
      scheduledJobs.get(key).stop();
      scheduledJobs.delete(key);
    }
    return;
  }

  const [hour, minute] = plugin.time.split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return;

  if (scheduledJobs.has(key)) {
    scheduledJobs.get(key).stop();
    scheduledJobs.delete(key);
  }

  const job = cron.schedule(
    `${minute} ${hour} * * *`,
    async () => {
      try {
        await sendWOTDNow(client, guildId, plugin);
      } catch (e) {
        console.error("[WOTD] send error:", e);
      }
    },
    { timezone: "UTC" }
  );
  scheduledJobs.set(key, job);
}

module.exports = { scheduleWordOfTheDay, sendWOTDNow };
