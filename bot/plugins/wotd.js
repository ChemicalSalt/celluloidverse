const cron = require("node-cron");
const { getRandomWord } = require("../utils/sheets");

const scheduledJobs = new Map();

/**
 * Schedule WOTD for a guild
 * @param {Client} client
 * @param {string} guildId
 * @param {object} plugin
 */
async function scheduleWordOfTheDay(client, guildId, plugin) {
  const key = `wotd:${guildId}`;

  // Stop and remove existing job if plugin disabled
  if (!plugin || !plugin.enabled || !plugin.channelId || !plugin.time) {
    if (scheduledJobs.has(key)) {
      scheduledJobs.get(key).stop();
      scheduledJobs.delete(key);
      console.log(`[WOTD] Stopped job for guild ${guildId}`);
    }
    return;
  }

  const [hour, minute] = plugin.time.split(":").map(Number);
  if (isNaN(hour) || isNaN(minute)) {
    console.warn(`[WOTD] Invalid time for guild ${guildId}: ${plugin.time}`);
    return;
  }

  // Remove existing job
  if (scheduledJobs.has(key)) {
    scheduledJobs.get(key).stop();
    scheduledJobs.delete(key);
  }

  const job = cron.schedule(
    `${minute} ${hour} * * *`,
    async () => {
      try {
        await sendWOTDNow(client, guildId, plugin);
      } catch (err) {
        console.error(`[WOTD] Error sending WOTD for guild ${guildId}:`, err);
      }
    },
    { timezone: "UTC" } // Make sure saved time is UTC
  );

  scheduledJobs.set(key, job);
  console.log(`[WOTD] Scheduled job for guild ${guildId} at ${plugin.time} UTC`);
}

/**
 * Send WOTD immediately
 * @param {Client} client
 * @param {string} guildId
 * @param {object} plugin
 */
async function sendWOTDNow(client, guildId, plugin) {
  if (!plugin?.enabled) return;

  const guild = client.guilds.cache.get(guildId);
  if (!guild) {
    console.warn(`[WOTD] Guild not found: ${guildId}`);
    return;
  }

  const channel =
    guild.channels.cache.get(plugin.channelId) ||
    (await guild.channels.fetch(plugin.channelId).catch(() => null));

  if (!channel) {
    console.warn(`[WOTD] Channel not found or bot cannot access: ${plugin.channelId}`);
    return;
  }

  const me = guild.members.me || (await guild.members.fetch(client.user.id).catch(() => null));
  if (!me || !channel.permissionsFor(me)?.has("SendMessages")) {
    console.warn(`[WOTD] Missing SendMessages permission in channel ${plugin.channelId}`);
    return;
  }

  const word = await getRandomWord(client);
  if (!word) {
    console.warn("[WOTD] No word retrieved from Google Sheets");
    return;
  }

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

  await channel.send(msg).catch((err) => {
    console.error(`[WOTD] Failed to send message in channel ${plugin.channelId}:`, err);
  });
}

module.exports = { scheduleWordOfTheDay, sendWOTDNow };
