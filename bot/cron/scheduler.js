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

  // Convert local time (user) → UTC
  const utcTime = moment.tz({ hour, minute }, plugin.timezone).utc();
  const hourUTC = utcTime.hour();
  const minuteUTC = utcTime.minute();

  // Log conversion clearly
  console.log(
    `[Debug] Local ${plugin.time} ${plugin.timezone} → UTC ${hourUTC}:${minuteUTC}`
  );

  _stopJob(key);

  try {
    const expr = `${minuteUTC} ${hourUTC} * * *`;

    const job = cron.schedule(
      expr,
      async () => {
        const localNow = moment.utc().tz(plugin.timezone).format("HH:mm");
        console.log(
          `[Scheduler] 🔔 Triggering for ${guildId} — Local ${localNow} (${plugin.timezone}), UTC ${moment.utc().format("HH:mm")}`
        );
        try {
          await sendLanguageNow(guildId, plugin);
        } catch (e) {
          console.error("[Scheduler] sendLanguageNow error:", e);
        }
      },
      { timezone: "UTC" }
    );

    scheduledJobs.set(key, job);

    const localFormatted = moment
      .tz({ hour: hourUTC, minute: minuteUTC }, "UTC")
      .tz(plugin.timezone)
      .format("HH:mm");

    console.log(
      `[Scheduler] ✅ Scheduled Language for ${guildId} — Local ${localFormatted} (${plugin.timezone}) [UTC ${hourUTC}:${minuteUTC}]`
    );
  } catch (err) {
    console.error("[Scheduler] failed to schedule:", err);
  }
}

function stopAll() {
  for (const k of scheduledJobs.keys()) _stopJob(k);
}

module.exports = { scheduleWordOfTheDay, stopAll };
