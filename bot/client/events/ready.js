const { scheduleWordOfTheDay } = require("../../plugins/wotd");

module.exports = async (client) => {
  const db = client.db;
  console.log(`✅ Bot logged in as ${client.user.tag}`);

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

  db.collection("guilds").onSnapshot((snap) => {
    snap.docChanges().forEach((change) => {
      const gid = change.doc.id;
      const plugins = change.doc.data()?.plugins || {};
      const lang = plugins.language || plugins.wotd;
      scheduleWordOfTheDay(client, gid, lang);
    });
  });
};
