module.exports = (client) => {
  const { db } = require("../../utils/firestore");
  const { scheduleWordOfTheDay } = require("../../cron/scheduler");

  client.once("ready", async () => {
    console.log(`Bot logged in as ${client.user.tag}`);

    // -----------------------------
    // ADDITION: Update bot status in Firestore
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

    // Optional: periodic update every 30 seconds
    setInterval(async () => {
      try {
        await botStatusRef.set(
          {
            online: client.isReady() ? true : false,
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
    // Existing scheduler & watcher code
    // -----------------------------
    try {
      const snapshot = await db.collection("guilds").get();
      snapshot.docs.forEach((doc) => {
        const gid = doc.id;
        const plugins = doc.data()?.plugins || {};
        const lang = plugins.language;

        if (lang?.enabled) {
          scheduleWordOfTheDay(gid, lang);
        }
      });
    } catch (err) {
      console.error("🔥 Error loading guild configs on startup:", err);
    }

    db.collection("guilds").onSnapshot(
      (snap) => {
        snap.docChanges().forEach((change) => {
          const gid = change.doc.id;
          const plugins = change.doc.data()?.plugins || {};
          const lang = plugins.language;

          if (lang?.enabled) {
            scheduleWordOfTheDay(gid, lang);
          }
        });
      },
      (err) => {
        console.error("[Firestore] watcher error:", err);
      }
    );
  });
};
