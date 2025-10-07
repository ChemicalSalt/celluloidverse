// cron/scheduler.js
const cron = require("node-cron");
const moment = require("moment-timezone");
const { db } = require("../utils/firestore"); // used by loadAllSchedules
const { sendLanguageNow } = require("../plugins/language");

const scheduledJobs = new Map();

function _stopJob(key) {
  if (scheduledJobs.has(key)) {
    try { scheduledJobs.get(key).stop(); } catch (e) {}
    scheduledJobs.delete(key);
    console.log(`[Scheduler] Stopped ${key}`);
  }
}

function _makeKey(guildId) {
  return `language:${guildId}`;
}

/**
 * Schedule the Word of the Day for a guild plugin config.
 * Accepts plugin with either:
 *  - plugin.utcTime (or plugin.timeUTC) OR
 *  - plugin.time + plugin.timezone  (will be converted to UTC)
 */
function scheduleWordOfTheDay(guildId, plugin = {}) {
  const key = _makeKey(guildId);

  // Basic validation
  if (!plugin || !plugin.enabled) {
    console.warn(`[Scheduler] Disabled or missing plugin for guild ${guildId}`);
    _stopJob(key);
    return;
  }
  if (!plugin.channelId) {
    console.warn(`[Scheduler] Missing channelId for guild ${guildId}`);
    _stopJob(key);
    return;
  }

  // Determine UTC time (HH:mm)
  let utcTime = plugin.utcTime || plugin.timeUTC || null;

  // If not present, but we have local time + timezone -> compute it
  if (!utcTime && plugin.time && plugin.timezone) {
    // Validate local time format
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
    console.log(`[Scheduler] Computed utcTime=${utcTime} from local ${plugin.time} (${plugin.timezone}) for guild ${guildId}`);
  }

  if (!utcTime) {
    console.warn(`[Scheduler] No utcTime and cannot compute it for guild ${guildId}`);
    _stopJob(key);
    return;
  }

  // Parse utcTime
  const parts = utcTime.split(":");
  if (parts.length !== 2) {
    console.error(`[Scheduler] Invalid utcTime format for guild ${guildId}: ${utcTime}`);
    _stopJob(key);
    return;
  }
  const hour = parseInt(parts[0], 10);
  const minute = parseInt(parts[1], 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    console.error(`[Scheduler] Invalid utcTime numbers for guild ${guildId}: ${utcTime}`);
    _stopJob(key);
    return;
  }

  // Stop any existing job first
  _stopJob(key);

  try {
    const expr = `${minute} ${hour} * * *`; // every day at hour:minute UTC
    const job = cron.schedule(
      expr,
      async () => {
        console.log(`[Scheduler] 🔔 Triggering Word for ${guildId} — UTC ${utcTime} (local: ${plugin.time || "N/A"} ${plugin.timezone || ""})`);
        try {
          await sendLanguageNow(guildId, plugin);
        } catch (e) {
          console.error("[Scheduler] sendLanguageNow error:", e);
        }
      },
      { scheduled: true, timezone: "UTC" }
    );

    scheduledJobs.set(key, job);

    console.log(`[Scheduler] ✅ Scheduled Language for ${guildId} at ${utcTime} UTC (orig local: ${plugin.time || "N/A"} ${plugin.timezone || "N/A"})`);
  } catch (err) {
    console.error(`[Scheduler] failed to schedule for ${guildId}:`, err);
  }
}

/**
 * Stop and clear all scheduled jobs
 */
function stopAll() {
  for (const k of Array.from(scheduledJobs.keys())) {
    _stopJob(k);
  }
}

/**
 * Load all plugin configs from Firestore and schedule them.
 * Call this at bot startup after DB is ready.
 */
async function loadAllSchedules() {
  try {
    const snapshot = await db.collection("plugins").get();
    snapshot.forEach(doc => {
      const guildId = doc.id;
      const plugin = doc.data()?.language;
      if (!plugin) {
        console.log(`[Scheduler] No language plugin for guild ${guildId}`);
        return;
      }
      // Schedule if enabled, else this will clear existing job
      scheduleWordOfTheDay(guildId, plugin);
    });
    console.log("[Scheduler] All schedules loaded from Firestore.");
  } catch (err) {
    console.error("[Scheduler] Failed to load schedules:", err);
  }
}

module.exports = {
  scheduleWordOfTheDay,
  loadAllSchedules,
  stopAll,
};
