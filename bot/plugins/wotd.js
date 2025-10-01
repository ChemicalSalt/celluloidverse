// plugins/wotd.js
// Exports a function that attaches plugin methods to the client (to avoid multiple instantiations).
const cron = require("node-cron");
const utils = require("../utils/helpers");
const sheetsUtil = require("../utils/sheets");

let scheduledJobs = new Map();

module.exports = (client, { db, sheets, helpers, scheduler } = {}) => {
  // attach to client.plugins
  client.plugins = client.plugins || {};
  client.plugins.wotd = {
    scheduleWordOfTheDay,
    sendWOTDNow,
    stopScheduleForGuild,
  };

  async function getRandomWord() {
    try {
      const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
      const RANGE = "Sheet1!A:H";
      const rows = await sheetsUtil.getAllRows(sheets, SPREADSHEET_ID, RANGE);
      if (!rows || !rows.length) return null;
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
      console.error("🔥 Error fetching from Google Sheets (wotd):", err);
      return null;
    }
  }

  function stopScheduleForGuild(guildId) {
    const key = `wotd:${guildId}`;
    if (scheduledJobs.has(key)) {
      try {
        scheduledJobs.get(key).stop();
      } catch {}
      scheduledJobs.delete(key);
      console.log(`[WOTD] ❌ Stopped schedule for guild ${guildId}`);
    }
  }

  function scheduleWordOfTheDay(guildId, plugin) {
    const key = `wotd:${guildId}`;

    if (!plugin || !plugin.enabled || !plugin.channelId || !plugin.time) {
      // stop existing if present
      stopScheduleForGuild(guildId);
      return;
    }

    const parts = (plugin.time || "").split(":").map((s) => Number(s));
    if (parts.length !== 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) {
      return console.error(`[WOTD] ⚠ Invalid time for guild ${guildId}:`, plugin.time);
    }
    const [hour, minute] = parts;

    // remove old job
    stopScheduleForGuild(guildId);

    try {
      const expr = `${minute} ${hour} * * *`; // daily at UTC hour:minute
      const job = cron.schedule(
        expr,
        async () => {
          try {
            await sendWOTDNow(guildId, plugin);
          } catch (e) {
            console.error("[WOTD] send error:", e);
          }
        },
        { timezone: "UTC" }
      );
      scheduledJobs.set(key, job);
      console.log(`[WOTD] ✅ Scheduled for guild ${guildId} at ${plugin.time} UTC (key=${key})`);
    } catch (err) {
      console.error("🔥 Failed to schedule WOTD:", err);
    }
  }

  async function sendWOTDNow(guildId, plugin) {
    if (!plugin?.enabled) return;
    try {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) return console.warn(`[WOTD] Guild not found in cache: ${guildId}`);

      const channel =
        guild.channels.cache.get(plugin.channelId) ||
        (await guild.channels.fetch(plugin.channelId).catch(() => null));
      if (!channel) return console.warn(`[WOTD] Channel not found: ${plugin.channelId}`);

      const me = guild.members.me || (await guild.members.fetch(client.user.id).catch(() => null));
      if (!me || !channel.permissionsFor(me)?.has("SendMessages")) {
        return console.warn(`[WOTD] Missing send permission in ${plugin.channelId}`);
      }

      const word = await getRandomWord();
      if (!word) return console.warn(`[WOTD] No word available`);

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
    } catch (err) {
      console.error("🔥 Error sending WOTD:", err);
    }
  }

  // export plugin functions by returning object (already attached to client.plugins)
  return client.plugins.wotd;
};
