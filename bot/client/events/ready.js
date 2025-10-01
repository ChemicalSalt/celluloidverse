const { scheduleWordOfTheDay } = require("../../plugins/wotd");

module.exports = {
  name: "ready",
  async execute(client) {
    console.log(`✅ Bot logged in as ${client.user.tag}`);

    // On startup, schedule existing WOTD
    try {
      const snapshot = await client.db.collection("guilds").get();
      snapshot.docs.forEach((doc) => {
        const gid = doc.id;
        const plugins = doc.data()?.plugins || {};
        const lang = plugins.language || plugins.wotd;
        if (lang?.enabled) scheduleWordOfTheDay(client, gid, lang);
      });
    } catch (err) {
      console.error("🔥 Error loading guild configs on startup:", err);
    }

    // Watch live changes
    client.db.collection("guilds").onSnapshot((snap) => {
      snap.docChanges().forEach((change) => {
        const gid = change.doc.id;
        const plugins = change.doc.data()?.plugins || {};
        const lang = plugins.language || plugins.wotd;
        scheduleWordOfTheDay(client, gid, lang);
      });
    });
  },
};
