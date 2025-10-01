const cron = require("node-cron");

async function getRandomWord(client) {
  try {
    const sheetsAuth = await client.sheetsAuth.getClient();
    const res = await client.sheets.spreadsheets.values.get({
      spreadsheetId: client.SPREADSHEET_ID,
      range: client.RANGE,
      auth: sheetsAuth,
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
    console.error("🔥 Error fetching WOTD:", err);
    return null;
  }
}

const scheduledJobs = new Map();

function scheduleWordOfTheDay(client, guildId, plugin) {
  const key = `wotd:${guildId}`;

  if (!plugin?.enabled || !plugin.channelId || !plugin.time) {
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

  const expr = `${minute} ${hour} * * *`;
  const job = cron.schedule(expr, async () => {
    try {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) return;

      const channel = guild.channels.cache.get(plugin.channelId) ||
        await guild.channels.fetch(plugin.channelId).catch(() => null);
      if (!channel) return;

      const me = guild.members.me || await guild.members.fetch(client.user.id).catch(() => null);
      if (!me || !channel.permissionsFor(me)?.has("SendMessages")) return;

      const word = await getRandomWord(client);
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
      console.log(`[WOTD] Sent to ${guildId}`);
    } catch (err) {
      console.error("🔥 WOTD send error:", err);
    }
  }, { timezone: "UTC" });

  scheduledJobs.set(key, job);
}

module.exports = { scheduleWordOfTheDay, getRandomWord };
