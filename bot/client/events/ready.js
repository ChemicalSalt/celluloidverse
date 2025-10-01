// client/events/ready.js
module.exports = (client) => {
  client.once("ready", async () => {
    console.log(`✅ Bot logged in as ${client.user.tag}`);

    const { db } = require("../../utils/firestore");
    const { scheduleWordOfTheDay } = require("../../cron/scheduler");

    // On startup, schedule existing language configs
    try {
      const snapshot = await db.collection("guilds").get();
      snapshot.docs.forEach((doc) => {
        const gid = doc.id;
        const plugins = doc.data()?.plugins || {};
        // prefer plugins.language, fallback to plugins.wotd (backwards compat)
        const lang = plugins.language || plugins.wotd;
        if (lang?.enabled) scheduleWordOfTheDay(gid, lang);
      });
    } catch (err) {
      console.error("🔥 Error loading guild configs on startup:", err);
    }

    // Live watcher: when guild docs change, reschedule
    db.collection("guilds").onSnapshot(
      (snap) => {
        snap.docChanges().forEach((change) => {
          const gid = change.doc.id;
          const plugins = change.doc.data()?.plugins || {};
          const lang = plugins.language || plugins.wotd;
          scheduleWordOfTheDay(gid, lang);
        });
      },
      (err) => {
        console.error("[Firestore] watcher error:", err);
      }
    );
  });
};
