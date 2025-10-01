// cron/scheduler.js
// Minimal central scheduler manager. Exported for potential direct control.
// Note: plugin-specific scheduling (WOTD) is managed inside plugins/wotd.js,
// but we keep a simple exported map/controller so other code can call it.

const scheduledJobs = new Map();

function setJob(key, job) {
  if (scheduledJobs.has(key)) {
    try {
      scheduledJobs.get(key).stop();
    } catch {}
    scheduledJobs.delete(key);
  }
  scheduledJobs.set(key, job);
}

function clearJob(key) {
  if (scheduledJobs.has(key)) {
    try {
      scheduledJobs.get(key).stop();
    } catch {}
    scheduledJobs.delete(key);
  }
}

function getJob(key) {
  return scheduledJobs.get(key);
}

function listJobs() {
  return Array.from(scheduledJobs.keys());
}

module.exports = {
  setJob,
  clearJob,
  getJob,
  listJobs,
  _map: scheduledJobs,
};
