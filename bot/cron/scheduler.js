// cron/scheduler.js
const cron = require("node-cron");
const moment = require("moment-timezone");
const { db } = require("../utils/firestore");
const { sendLanguageNow } = require("../plugins/language");

const scheduledJobs = new Map();

function _stopJob(key) {
  if (scheduledJobs.has(key)) {
    try {
      scheduledJobs.get(key).stop();
    } catch (e) {}
    scheduledJobs.delete(key);
    console.log(`[Scheduler] Stopped ${key}`);
  }
}

function _makeKey(guildId, lang) {
  return `language:${guildId}:${lang}`;
}

function scheduleWordOfTheDay(guildId, plugin = {}, langKey = "mandarin") {
  const key = _makeKey(guildId, langKey);

  if (!plugin || !plugin.enabled) {
    console.warn(`[Scheduler] Disabled or missing plugin for guild ${guildId} (${langKey})`);
    _stopJob(key);
    return;
  }
  if (!plugin.channelId) {
    console.warn(`[Scheduler] Missing channelId for guild ${guildId} (${langKey})`);
    _stopJob(key);
    return;
  }

  let utcTime = plugin.utcTime || plugin.timeUTC || null;

  if (!utcTime && plugin.time && plugin.timezone) {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(plugin.time)) {
      console.error(`[Scheduler] Invalid local time format for guild ${guildId}: ${plugin.time}`);
      _stopJob(key);
      return;
    }
    if (!moment.tz.zone(plugin.timezone)) {
      console.error(`[Scheduler] Invalid timezone for guild ${guildId}: ${plugin.timezone}`);
      _stopJob(key);
      return;
    }

    const [h, m] = plugin.time.split(":").map(Number);
    utcTime = moment.tz({ hour: h, minute: m }, plugin.timezone).utc().format("HH:mm");
    console.log(`[Scheduler] Computed utcTime=${utcTime} from local ${plugin.time} (${plugin.timezone}) for ${guildId}`);
  }

  if (!utcTime) {
    console.warn(`[Scheduler] No utcTime found for guild ${guildId} (${langKey})`);
    _stopJob(key);
    return;
  }

  const [hour, minute] = utcTime.split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    console.error(`[Scheduler] Invalid utcTime numbers for guild ${guildId}: ${utcTime}`);
    _stopJob(key);
    return;
  }

  _stopJob(key);

  try {
    const expr = `${minute} ${hour} * * *`; // every day at HH:mm UTC
    const job = cron.schedule(
      expr,
      async () => {
        console.log(`[Scheduler] 🔔 Trigger ${langKey} for ${guildId} — UTC ${utcTime} (local: ${plugin.time || "N/A"} ${plugin.timezone || ""})`);
        try {
          await sendLanguageNow(guildId, { ...plugin, language: langKey });
        } catch (e) {
          console.error("[Scheduler] sendLanguageNow error:", e);
        }
      },
      { scheduled: true, timezone: "UTC" }
    );

    scheduledJobs.set(key, job);
    console.log(`[Scheduler] ✅ Scheduled ${langKey} for ${guildId} at ${utcTime} UTC`);
  } catch (err) {
    console.error(`[Scheduler] failed to schedule for ${guildId}:`, err);
  }
}

function stopAll() {
  for (const k of Array.from(scheduledJobs.keys())) {
    _stopJob(k);
  }
}

async function loadAllSchedules() {
  try {
    const snapshot = await db.collection("guilds").get();
    snapshot.forEach(doc => {
      const guildId = doc.id;
      const plugin = doc.data()?.plugins?.language;
      if (!plugin) {
        console.log(`[Scheduler] No language plugin for guild ${guildId}`);
        return;
      }

      // Multiple languages
      for (const [langKey, langData] of Object.entries(plugin)) {
        if (langKey !== "enabled" && langData?.enabled) {
          scheduleWordOfTheDay(guildId, langData, langKey);
        }
      }
    });
    console.log("[Scheduler] ✅ All schedules loaded from Firestore.");
  } catch (err) {
    console.error("[Scheduler] Failed to load schedules:", err);
  }
}

module.exports = {
  scheduleWordOfTheDay,
  loadAllSchedules,
  stopAll,
};
