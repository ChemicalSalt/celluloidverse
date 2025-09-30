// cron/scheduler.js
const cron = require("node-cron");
const { sendWOTDNow } = require("../plugins/wotd");

const scheduledJobs = new Map();

/**
 * Schedule a daily job for WOTD
 * @param {Client} client Discord client
 * @param {string} guildId Guild ID
 * @param {object} plugin Plugin settings (channelId, time, enabled)
 */
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
      console.log(`[WOTD] ⚡ Triggering send for guild ${guildId} at ${plugin.time} UTC`);
      await sendWOTDNow(client, guildId, plugin).catch(console.error);
    },
    { timezone: "UTC" }
  );

  scheduledJobs.set(key, job);
  console.log(`[WOTD] ✅ Scheduled for guild ${guildId} at ${plugin.time} UTC`);
}

module.exports = { scheduleWordOfTheDay };