// events/ready.js
module.exports = (client) => {
  const { db } = require("../../utils/firestore");
  const { loadAllSchedules } = require("../../cron/scheduler");

  client.once("ready", async () => {
    console.log(`Bot logged in as ${client.user.tag}`);

    // -----------------------------
    // Update bot status in Firestore
    // -----------------------------
    const botStatusRef = db.collection("botStatus").doc("main");
    await botStatusRef.set(
      {
        online: true,
        servers: client.guilds.cache.size,
        ping: client.ws.ping,
        timestamp: new Date().toISOString(),
      },
      { merge: true }
    );

    // Periodic update every 30s
    setInterval(async () => {
      try {
        await botStatusRef.set(
          {
            online: client.isReady(),
            servers: client.guilds.cache.size,
            ping: client.ws.ping,
            timestamp: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error("[Bot Status] periodic update failed:", err);
      }
    }, 30000);

    // -----------------------------
    // Load all language schedules safely
    // -----------------------------
    try {
      await loadAllSchedules();
      console.log("[Scheduler] 🔁 All jobs loaded from Firestore");
    } catch (err) {
      console.error("🔥 Error loading language schedules on startup:", err);
    }

    // Optional: Live Firestore watcher for real-time rescheduling
    db.collection("guilds").onSnapshot(
      async (snap) => {
        console.log("[Firestore] 🔄 Detected guild config changes");
        await loadAllSchedules(); // reload everything cleanly
      },
      (err) => console.error("[Firestore] watcher error:", err)
    );
  });
};
