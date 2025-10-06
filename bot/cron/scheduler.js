const cron = require("node-cron");
const moment = require("moment-timezone");
const scheduledJobs = new Map();
const { sendLanguageNow } = require("../plugins/language");

function _stopJob(key) {
  if (scheduledJobs.has(key)) {
    try {
      scheduledJobs.get(key).stop();
    } catch {}
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

  // Convert local time → UTC for scheduling
  const utcTime = moment.tz({ hour, minute }, plugin.timezone).utc();
  const hourUTC = utcTime.hour();
  const minuteUTC = utcTime.minute();

  // Compute what that UTC time looks like back in the user's local zone
  const localFormatted = moment
    .tz({ hour: hourUTC, minute: minuteUTC }, "UTC")
    .tz(plugin.timezone)
    .format("HH:mm");

  _stopJob(key);

  try {
    const expr = `${minuteUTC} ${hourUTC} * * *`;

    const job = cron.schedule(
      expr,
      async () => {
        console.log(`[Scheduler] 🔔 Running Language for ${guildId} (${localFormatted} ${plugin.timezone})`);
        try {
          await sendLanguageNow(guildId, plugin);
        } catch (e) {
          console.error("[Scheduler] sendLanguageNow error:", e);
        }
      },
      { timezone: "UTC" } // cron executes in UTC space
    );

    scheduledJobs.set(key, job);

    console.log(
      `[Scheduler] ✅ Scheduled Language for ${guildId} at ${localFormatted} (${plugin.timezone}) [UTC ${hourUTC}:${minuteUTC}]`
    );
  } catch (err) {
    console.error("[Scheduler] failed to schedule:", err);
  }
}

function stopAll() {
  for (const k of scheduledJobs.keys()) _stopJob(k);
}

module.exports = { scheduleWordOfTheDay, stopAll };
