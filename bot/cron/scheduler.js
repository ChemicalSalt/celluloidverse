// cron/scheduler.js
const cron = require("node-cron");
const moment = require("moment-timezone");
const { db } = require("../utils/firestore");
const { sendLanguageNow } = require("../plugins/language");

const scheduledJobs = new Map();

/** Create a unique key per guild + language */
function _makeKey(guildId, lang) {
  return `language:${guildId}:${lang}`;
}

/** Stop a running cron job */
function _stopJob(key) {
  if (scheduledJobs.has(key)) {
    try {
      scheduledJobs.get(key).stop();
    } catch (e) {}
    scheduledJobs.delete(key);
    console.log(`[Scheduler] ⛔ Stopped job ${key}`);
  }
}

/** Schedule a daily word-of-the-day message for one language */
function scheduleWordOfTheDay(guildId, plugin = {}, langKey = "japanese") {
  const key = _makeKey(guildId, langKey);

  if (!plugin || !plugin.enabled) {
    _stopJob(key);
    console.warn(`[Scheduler] ⚠️ Plugin disabled or missing for ${guildId} (${langKey})`);
    return;
  }

  if (!plugin.channelId) {
    _stopJob(key);
    console.warn(`[Scheduler] ⚠️ Missing channelId for ${guildId} (${langKey})`);
    return;
  }

  let utcTime = plugin.utcTime || plugin.timeUTC || null;

  // Convert local time to UTC
  if (!utcTime && plugin.time && plugin.timezone) {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(plugin.time)) {
      console.error(`[Scheduler] ❌ Invalid time format for ${guildId} (${plugin.time})`);
      _stopJob(key);
      return;
    }
    if (!moment.tz.zone(plugin.timezone)) {
      console.error(`[Scheduler] ❌ Invalid timezone for ${guildId}: ${plugin.timezone}`);
      _stopJob(key);
      return;
    }

    const [h, m] = plugin.time.split(":").map(Number);
    utcTime = moment.tz({ hour: h, minute: m }, plugin.timezone).utc().format("HH:mm");
    console.log(`[Scheduler] 🕒 Computed UTC ${utcTime} from ${plugin.time} (${plugin.timezone}) for ${guildId}`);
  }

  if (!utcTime) {
    console.warn(`[Scheduler] ⚠️ No utcTime found for ${guildId} (${langKey})`);
    _stopJob(key);
    return;
  }

  const [hour, minute] = utcTime.split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    console.error(`[Scheduler] ❌ Invalid utcTime for guild ${guildId}: ${utcTime}`);
    _stopJob(key);
    return;
  }

  // Stop any old job before starting a new one
  _stopJob(key);

  try {
    const expr = `${minute} ${hour} * * *`; // every day at HH:mm UTC
    const job = cron.schedule(
      expr,
      async () => {
        console.log(`[Scheduler] 🔔 Triggering ${langKey} for ${guildId} at ${utcTime} UTC`);
        try {
          await sendLanguageNow(guildId, { ...plugin, language: langKey });
        } catch (err) {
          console.error(`[Scheduler] ❌ sendLanguageNow error for ${guildId} (${langKey}):`, err);
        }
      },
      { scheduled: true, timezone: "UTC" }
    );

    scheduledJobs.set(key, job);
    console.log(`[Scheduler] ✅ Scheduled ${langKey} for ${guildId} at ${utcTime} UTC`);
  } catch (err) {
    console.error(`[Scheduler] ❌ Failed to schedule ${guildId} (${langKey}):`, err);
  }
}

/** Stop all jobs safely */
function stopAll() {
  for (const key of Array.from(scheduledJobs.keys())) {
    _stopJob(key);
  }
  console.log("[Scheduler] 🧹 All jobs stopped.");
}

/** Load all schedules from Firestore and reschedule them */
async function loadAllSchedules() {
  try {
    const snapshot = await db.collection("guilds").get();
    console.log(`[Scheduler] 🔄 Loading schedules for ${snapshot.size} guilds...`);

    snapshot.forEach(doc => {
      const guildId = doc.id;
   // When loading schedules from Firestore
const plugin = doc.data().language; // <--- get the language map
if (!plugin) return;

for (const [langKey, langData] of Object.entries(plugin)) {
  if (!langData || !langData.enabled) continue;
  scheduleWordOfTheDay(guildId, plugin, langKey);
}
 });

    console.log("[Scheduler] ✅ All language schedules loaded.");
  } catch (err) {
    console.error("[Scheduler] ❌ Failed to load schedules:", err);
  }
}

module.exports = {
  scheduleWordOfTheDay,
  loadAllSchedules,
  stopAll,
};
