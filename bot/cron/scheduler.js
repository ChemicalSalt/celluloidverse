// cron/scheduler.js
const cron = require("node-cron");
const scheduledJobs = new Map();
const { sendWOTDNow } = require("../plugins/language");

function _stopJob(key) {
  if (scheduledJobs.has(key)) {
    try {
      scheduledJobs.get(key).stop();
    } catch {}
    scheduledJobs.delete(key);
    console.log(`[Scheduler] Stopped ${key}`);
  }
}

/**
 * plugin is a map containing at least: enabled, channelId, time (HH:MM), timezone (optional)
 */
function scheduleWordOfTheDay(guildId, plugin = {}) {
  const key = `wotd:${guildId}`;

  if (!plugin || !plugin.enabled || !plugin.channelId || !plugin.time) {
    _stopJob(key);
    return;
  }

  // parse HH:MM
  const parts = String(plugin.time).split(":").map((s) => Number(s));
  if (parts.length !== 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) {
    console.error(`[Scheduler] Invalid time for guild ${guildId}: ${plugin.time}`);
    return;
  }
  const [hour, minute] = parts;

  // stop old job
  _stopJob(key);

  try {
    // run daily at minute hour (cron in UTC by default or timezone if provided)
    const expr = `${minute} ${hour} * * *`;
    const job = cron.schedule(
      expr,
      async () => {
        console.log(`[Scheduler] Triggering WOTD for ${guildId} at ${plugin.time} (tz=${plugin.timezone || "UTC"})`);
        try {
          await sendWOTDNow(guildId, plugin);
        } catch (e) {
          console.error("[Scheduler] sendWOTDNow error:", e);
        }
      },
      { timezone: plugin.timezone || "UTC" }
    );
    scheduledJobs.set(key, job);
    console.log(`[Scheduler] Scheduled WOTD for ${guildId} at ${plugin.time} (${plugin.timezone || "UTC"})`);
  } catch (err) {
    console.error("[Scheduler] failed to schedule:", err);
  }
}

function stopAll() {
  for (const k of Array.from(scheduledJobs.keys())) _stopJob(k);
}

module.exports = { scheduleWordOfTheDay, stopAll };
