const cron = require("node-cron");
const scheduledJobs = new Map();
const { sendLanguageNow } = require("../plugins/language"); 
const moment = require("moment-timezone"); // make sure installed

function _stopJob(key) {
  if (scheduledJobs.has(key)) {
    try { scheduledJobs.get(key).stop(); } catch {}
    scheduledJobs.delete(key);
    console.log(`[Scheduler] Stopped ${key}`);
  }
}

function scheduleWordOfTheDay(guildId, plugin = {}) {
  const key = `language:${guildId}`;

  if (!plugin || !plugin.enabled || !plugin.channelId || !plugin.time || !plugin.timezone) {
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

  // Convert local time to UTC
  const utcTime = moment.tz({ hour, minute }, plugin.timezone).utc();
  const hourUTC = utcTime.hour();
  const minuteUTC = utcTime.minute();

  _stopJob(key);

  try {
    const expr = `${minuteUTC} ${hourUTC} * * *`;

    const job = cron.schedule(
      expr,
      async () => {
        console.log(`[Scheduler] Triggering Language for ${guildId} at ${plugin.time} (${plugin.timezone}) -> ${hourUTC}:${minuteUTC} UTC`);
        try { await sendLanguageNow(guildId, plugin); } 
        catch (e) { console.error("[Scheduler] sendLanguageNow error:", e); }
      },
      { timezone: "UTC" } // cron always runs in UTC
    );

    scheduledJobs.set(key, job);
    console.log(`[Scheduler] Scheduled Language for ${guildId} at ${plugin.time} (${plugin.timezone}) -> ${hourUTC}:${minuteUTC} UTC`);
  } catch (err) {
    console.error("[Scheduler] failed to schedule:", err);
  }
}

function stopAll() {
  for (const k of Array.from(scheduledJobs.keys())) _stopJob(k);
}

module.exports = { scheduleWordOfTheDay, stopAll };
