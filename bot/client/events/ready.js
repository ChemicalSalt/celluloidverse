// client/events/ready.js
const db = require("../../utils/firestore");
const { scheduleWordOfTheDay } = require("../../plugins/wotd");

module.exports = (client) => {
  client.once("ready", async () => {
    console.log(`✅ Bot logged in as ${client.user.tag}`);

    // Schedule existing guilds
    try {
      const snapshot = await db.collection("guilds").get();
      snapshot.docs.forEach((doc) => {
        const gid = doc.id;
        const plugins = doc.data()?.plugins || {};
        const lang = plugins.language || plugins.wotd;
        if (lang?.enabled) scheduleWordOfTheDay(client, gid, lang);
      });
    } catch (err) {
      console.error("🔥 Error loading guild configs on startup:", err);
    }

    // Live watcher
    db.collection("guilds").onSnapshot((snap) => {
      snap.docChanges().forEach((change) => {
        const gid = change.doc.id;
        const plugins = change.doc.data()?.plugins || {};
        const lang = plugins.language || plugins.wotd;
        scheduleWordOfTheDay(client, gid, lang);
      });
    });
  });
};
