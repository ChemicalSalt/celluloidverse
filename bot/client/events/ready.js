module.exports = (client) => {
  const { db } = require("../../utils/firestore");
  const { scheduleWordOfTheDay } = require("../../cron/scheduler");

  client.once("ready", async () => {
    console.log(`✅ Bot logged in as ${client.user.tag}`);

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

    // Live Firestore watcher
    db.collection("guilds").onSnapshot(
      (snap) => {
        snap.docChanges().forEach((change) => {
          const gid = change.doc.id;
          const plugins = change.doc.data()?.plugins || {};
          const lang = plugins.language;

          // Only schedule if language plugin exists and is enabled
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
