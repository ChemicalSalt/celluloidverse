const cron = require("node-cron");
const { getRandomWord } = require("../utils/sheets");

const scheduledJobs = new Map();

async function scheduleWordOfTheDay(client, guildId, plugin) {
  const key = `wotd:${guildId}`;

  if (!plugin || !plugin.enabled || !plugin.channelId || !plugin.time) {
    if (scheduledJobs.has(key)) {
      scheduledJobs.get(key).stop();
      scheduledJobs.delete(key);
    }
    return;
  }

  const [hour, minute] = plugin.time.split(":").map(Number);
  if (isNaN(hour) || isNaN(minute)) return;

  if (scheduledJobs.has(key)) {
    scheduledJobs.get(key).stop();
    scheduledJobs.delete(key);
  }

  console.log(`[WOTD] Scheduled job for guild ${guildId} at ${hour}:${minute} UTC`);

  const job = cron.schedule(
    `${minute} ${hour} * * *`,
    async () => {
      await sendWOTDNow(client, guildId, plugin);
    },
    { timezone: "UTC" }
  );

  scheduledJobs.set(key, job);
}

async function sendWOTDNow(client, guildId, plugin) {
  if (!plugin?.enabled) return;

  const guild = client.guilds.cache.get(guildId);
  if (!guild) return;

  const channel =
    guild.channels.cache.get(plugin.channelId) ||
    (await guild.channels.fetch(plugin.channelId).catch(() => null));
  if (!channel) return;

  const me =
    guild.members.me ||
    (await guild.members.fetch(client.user.id).catch(() => null));
  if (!me || !channel.permissionsFor(me)?.has("SendMessages")) return;

  const word = await getRandomWord(client);
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

  await channel.send(msg).catch(console.error);
}

module.exports = { scheduleWordOfTheDay, sendWOTDNow };
