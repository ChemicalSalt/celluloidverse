const cron = require("node-cron");
const scheduledJobs = new Map();
const { sendLanguageNow } = require("../plugins/language"); // renamed

function _stopJob(key) {
  if (scheduledJobs.has(key)) {
    try { scheduledJobs.get(key).stop(); } catch {}
    scheduledJobs.delete(key);
    console.log(`[Scheduler] Stopped ${key}`);
  }
}

function scheduleWordOfTheDay(guildId, plugin = {}) {
  const key = `language:${guildId}`; // use plugin name

  if (!plugin || !plugin.enabled || !plugin.channelId || plugin.hourUTC == null || plugin.minuteUTC == null) {
    _stopJob(key);
    return;
  }

  _stopJob(key);

  try {
    // Use UTC hour/minute for cron expression
    const expr = `${plugin.minuteUTC} ${plugin.hourUTC} * * *`;

    const job = cron.schedule(
      expr,
      async () => {
        console.log(`[Scheduler] Triggering Language for ${guildId} at ${plugin.hourUTC}:${plugin.minuteUTC} (tz=${plugin.timezone || "UTC"})`);
        try { await sendLanguageNow(guildId, plugin); } 
        catch (e) { console.error("[Scheduler] sendLanguageNow error:", e); }
      },
      { timezone: "UTC" } // always schedule in UTC
    );

    scheduledJobs.set(key, job);
    console.log(`[Scheduler] Scheduled Language for ${guildId} at ${plugin.hourUTC}:${plugin.minuteUTC} (${plugin.timezone || "UTC"})`);
  } catch (err) {
    console.error("[Scheduler] failed to schedule:", err);
  }
}

function stopAll() {
  for (const k of Array.from(scheduledJobs.keys())) _stopJob(k);
}

module.exports = { scheduleWordOfTheDay, stopAll };
