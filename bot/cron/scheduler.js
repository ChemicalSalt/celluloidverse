const cron = require("node-cron");
const { db } = require("../utils/firestore");
const { sendLanguageNow } = require("../plugins/language");

const scheduledJobs = new Map();

/**
 * Clears any old job for a guild before scheduling a new one.
 */
function clearExistingJob(guildId) {
  if (scheduledJobs.has(guildId)) {
    const oldJob = scheduledJobs.get(guildId);
    oldJob.stop();
    scheduledJobs.delete(guildId);
    console.log(`[Scheduler] Cleared old job for guild ${guildId}`);
  }
}

/**
 * Schedule the Word of the Day job.
 * @param {string} guildId - Discord guild ID
 * @param {object} plugin - Plugin data including utcTime
 */
function scheduleWordOfTheDay(guildId, plugin) {
  try {
    clearExistingJob(guildId);

    if (!plugin?.enabled || !plugin?.utcTime) {
      console.warn(`[Scheduler] Invalid or disabled plugin for guild ${guildId}`);
      return;
    }

    // ✅ Extract UTC hour & minute
    const [hour, minute] = plugin.utcTime.split(":").map(Number);

    // ✅ Cron runs in UTC automatically → no need to convert again
    const cronExp = `${minute} ${hour} * * *`;

    const job = cron.schedule(
      cronExp,
      async () => {
        console.log(`[Scheduler] Running job for guild ${guildId} (${plugin.language}) at ${plugin.utcTime} UTC`);
        await sendLanguageNow(guildId, plugin);
      },
      {
        scheduled: true,
        timezone: "UTC",
      }
    );

    scheduledJobs.set(guildId, job);
    console.log(`[Scheduler] Scheduled job for guild ${guildId} at ${plugin.utcTime} UTC`);
  } catch (err) {
    console.error(`[Scheduler] Error while scheduling for ${guildId}:`, err);
  }
}

/**
 * Load all plugin configs from Firestore at startup and reschedule them.
 */
async function loadAllSchedules() {
  try {
    const snapshot = await db.collection("plugins").get();
    snapshot.forEach(doc => {
      const guildId = doc.id;
      const plugin = doc.data()?.language;
      if (plugin?.enabled && plugin?.utcTime) {
        scheduleWordOfTheDay(guildId, plugin);
      }
    });
    console.log("[Scheduler] All schedules loaded from Firestore.");
  } catch (err) {
    console.error("[Scheduler] Failed to load schedules:", err);
  }
}

module.exports = {
  scheduleWordOfTheDay,
  loadAllSchedules,
};
