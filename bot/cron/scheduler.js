const cron = require("node-cron");
const moment = require("moment-timezone");
const scheduledJobs = new Map();
const { sendLanguageNow } = require("../plugins/language");

function _stopJob(key) {
  if (scheduledJobs.has(key)) {
    try { scheduledJobs.get(key).stop(); } catch {}
    scheduledJobs.delete(key);
    console.log(`[Scheduler] Stopped ${key}`);
  }
}

function scheduleWordOfTheDay(guildId, plugin = {}) {
  const key = `language:${guildId}`;

  if (!plugin?.enabled || !plugin.channelId || !plugin.time || !plugin.timezone) {
    _stopJob(key);
    return;
  }

  const [hourStr, minuteStr] = plugin.time.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  if (isNaN(hour) || isNaN(minute)) {
    console.error(`[Scheduler] Invalid time for guild ${guildId}: ${plugin.time}`);
    return;
  }

  _stopJob(key);

  try {
    const expr = `${minute} ${hour} * * *`;

    const job = cron.schedule(
      expr,
      async () => {
        const localNow = moment().tz(plugin.timezone).format("HH:mm");
        console.log(
          `[Scheduler] 🔔 Triggering Word for ${guildId} — Local ${localNow} (${plugin.timezone})`
        );
        try {
          await sendLanguageNow(guildId, plugin);
        } catch (e) {
          console.error("[Scheduler] sendLanguageNow error:", e);
        }
      },
      { timezone: plugin.timezone }
    );

    scheduledJobs.set(key, job);

    console.log(
      `[Scheduler] ✅ Scheduled Language for ${guildId} at ${plugin.time} (${plugin.timezone})`
    );
  } catch (err) {
    console.error("[Scheduler] failed to schedule:", err);
  }
}

function stopAll() {
  for (const k of scheduledJobs.keys()) _stopJob(k);
}

module.exports = { scheduleWordOfTheDay, stopAll };
