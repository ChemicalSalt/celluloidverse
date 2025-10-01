// client/events/ready.js
// Fires once: schedules wotd for guilds on startup and sets a watcher for changes.
module.exports = {
  name: "ready",
  once: true,
  execute: async (client) => {
    console.log(`✅ Bot logged in as ${client.user.tag}`);

    // On startup, schedule existing language configs
    try {
      const snapshot = await client.db.collection("guilds").get();
      snapshot.docs.forEach((doc) => {
        const gid = doc.id;
        const plugins = doc.data()?.plugins || {};
        const lang = plugins.language || plugins.wotd;
        if (lang?.enabled && client.plugins && client.plugins.wotd) {
          client.plugins.wotd.scheduleWordOfTheDay(gid, lang);
        } else if (lang?.enabled) {
          // fallback call directly to scheduler plugin if loaded differently
          try {
            const wotd = require("../../plugins/wotd");
            wotd(client, { db: client.db, scheduler: require("../../cron/scheduler"), helpers: client.helpers });
            client.plugins = client.plugins || {};
            client.plugins.wotd = wotd;
            client.plugins.wotd.scheduleWordOfTheDay(gid, lang);
          } catch (e) {
            console.error("[READY] Couldn't schedule wotd for", gid, e);
          }
        }
      });
    } catch (err) {
      console.error("🔥 Error loading guild configs on startup:", err);
    }

    // Live watcher: when guild docs change, reschedule (works with Firestore snapshots)
    try {
      client.db.collection("guilds").onSnapshot((snap) => {
        snap.docChanges().forEach((change) => {
          const gid = change.doc.id;
          const plugins = change.doc.data()?.plugins || {};
          const lang = plugins.language || plugins.wotd;
          if (client.plugins && client.plugins.wotd) {
            client.plugins.wotd.scheduleWordOfTheDay(gid, lang);
          }
        });
      });
    } catch (e) {
      console.warn("⚠ Live watcher for guilds failed (maybe admin Firestore doesn't support onSnapshot in this env).", e);
    }
  },
};
