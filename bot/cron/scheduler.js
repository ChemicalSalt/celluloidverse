// cron/scheduler.js
const cron = require("node-cron");
const moment = require("moment-timezone");
const { db } = require("../utils/firestore");
const { sendLanguageNow } = require("../plugins/language");

const scheduledJobs = new Map();

// ===== Internal Helpers =====
function _stopJob(key) {
  if (scheduledJobs.has(key)) {
    try { scheduledJobs.get(key).stop(); } catch (e) {}
    scheduledJobs.delete(key);
    console.log(`[Scheduler] Stopped ${key}`);
  }
}

function _makeKey(guildId, lang) {
  return `language:${guildId}:${lang}`;
}

// ===== Main Scheduler =====
function scheduleWordOfTheDay(guildId, plugin = {}) {
  if (!plugin || !plugin.enabled) {
    console.warn(`[Scheduler] Disabled or missing plugin for guild ${guildId}`);
    return;
  }

  const languages = Object.keys(plugin.languages || {}).length
    ? plugin.languages
    : { [plugin.language || "japanese"]: plugin };

  // Schedule each language separately
  for (const [lang, langConfig] of Object.entries(languages)) {
    const key = _makeKey(guildId, lang);

    if (!langConfig.enabled) {
      _stopJob(key);
      continue;
    }
    if (!langConfig.channelId) {
      console.warn(`[Scheduler] Missing channelId for ${guildId} (${lang})`);
      _stopJob(key);
      continue;
    }

    let utcTime = langConfig.utcTime || langConfig.timeUTC || null;

    // Compute UTC if only local time given
    if (!utcTime && langConfig.time && langConfig.timezone) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(langConfig.time)) {
        console.error(`[Scheduler] Invalid local time for ${guildId}:${lang}`);
        _stopJob(key);
        continue;
      }
      if (!moment.tz.zone(langConfig.timezone)) {
        console.error(`[Scheduler] Invalid timezone for ${guildId}:${lang}`);
        _stopJob(key);
        continue;
      }
      const [h, m] = langConfig.time.split(":").map(Number);
      utcTime = moment.tz({ hour: h, minute: m }, langConfig.timezone)
        .utc()
        .format("HH:mm");
      console.log(`[Scheduler] Computed utcTime=${utcTime} for ${guildId}:${lang}`);
    }

    if (!utcTime) {
      console.warn(`[Scheduler] No UTC time for ${guildId}:${lang}`);
      _stopJob(key);
      continue;
    }

    const [hour, minute] = utcTime.split(":").map(Number);
    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      console.error(`[Scheduler] Invalid utcTime for ${guildId}:${lang}`);
      _stopJob(key);
      continue;
    }

    _stopJob(key);

    try {
      const expr = `${minute} ${hour} * * *`; // every day UTC
      const job = cron.schedule(
        expr,
        async () => {
          console.log(
            `[Scheduler] 🔔 Trigger ${guildId}:${lang} — ${utcTime} UTC (${langConfig.time || "N/A"} ${langConfig.timezone || ""})`
          );
          try {
            await sendLanguageNow(guildId, { ...langConfig, language: lang });
          } catch (e) {
            console.error(`[Scheduler] sendLanguageNow error for ${guildId}:${lang}`, e);
          }
        },
        { scheduled: true, timezone: "UTC" }
      );

      scheduledJobs.set(key, job);
      console.log(`[Scheduler] ✅ Scheduled ${lang} for ${guildId} at ${utcTime} UTC`);
    } catch (err) {
      console.error(`[Scheduler] Failed to schedule ${guildId}:${lang}`, err);
    }
  }
}

// ===== Stop All =====
function stopAll() {
  for (const k of Array.from(scheduledJobs.keys())) {
    _stopJob(k);
  }
}

// ===== Load All Guilds =====
async function loadAllSchedules() {
  try {
    const snapshot = await db.collection("plugins").get();
    snapshot.forEach(doc => {
      const guildId = doc.id;
      const data = doc.data()?.language;

      if (!data) {
        console.log(`[Scheduler] No language config for guild ${guildId}`);
        return;
      }

      // backward compatibility — single language configs still work
      scheduleWordOfTheDay(guildId, data);
    });
    console.log("[Scheduler] ✅ All schedules loaded from Firestore");
  } catch (err) {
    console.error("[Scheduler] ❌ Failed to load schedules:", err);
  }
}

module.exports = {
  scheduleWordOfTheDay,
  loadAllSchedules,
  stopAll,
};
