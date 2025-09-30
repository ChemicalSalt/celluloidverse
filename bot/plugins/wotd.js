const cron = require("node-cron");
const { sheets, SPREADSHEET_ID, RANGE, auth } = require("../config/sheetsConfig");

const scheduledJobs = new Map();

async function getRandomWord() {
  try {
    const clientSheets = await auth.getClient();
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

function scheduleWordOfTheDay(guildId, plugin, client) {
  const key = `wotd:${guildId}`;

  if (!plugin?.enabled || !plugin.channelId || !plugin.time) {
    if (scheduledJobs.has(key)) {
      scheduledJobs.get(key).stop();
      scheduledJobs.delete(key);
      console.log(`[WOTD] ❌ Stopped schedule for guild ${guildId}`);
    }
    return;
  }

  const [hour, minute] = plugin.time.split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return;

  if (scheduledJobs.has(key)) {
    scheduledJobs.get(key).stop();
    scheduledJobs.delete(key);
  }

  const expr = `${minute} ${hour} * * *`;
  const job = cron.schedule(
    expr,
    async () => {
      try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return;
        const channel =
          guild.channels.cache.get(plugin.channelId) ||
          (await guild.channels.fetch(plugin.channelId).catch(() => null));
        if (!channel || !channel.permissionsFor(guild.members.me)?.has("SendMessages"))
          return;

        const word = await getRandomWord();
        if (!word) return;

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

        await channel.send(msg);
        console.log(`[WOTD] ✅ Sent to guild ${guildId}`);
      } catch (err) {
        console.error("[WOTD] Send error:", err);
      }
    },
    { timezone: "UTC" }
  );

  scheduledJobs.set(key, job);
  console.log(`[WOTD] ✅ Scheduled WOTD for guild ${guildId} at ${plugin.time} UTC`);
}

module.exports = { scheduleWordOfTheDay };
