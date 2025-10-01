const { scheduleWordOfTheDay } = require("../../plugins/wotd");

module.exports = async (client) => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);

  // schedule WOTD for all guilds on startup
  const snapshot = await client.db.collection("guilds").get();
  snapshot.docs.forEach(doc => {
    const plugins = doc.data()?.plugins || {};
    const lang = plugins.language || plugins.wotd;
    if (lang?.enabled) scheduleWordOfTheDay(client, doc.id, lang);
  });

  // live watcher
  client.db.collection("guilds").onSnapshot(snap => {
    snap.docChanges().forEach(change => {
      const plugins = change.doc.data()?.plugins || {};
      const lang = plugins.language || plugins.wotd;
      scheduleWordOfTheDay(client, change.doc.id, lang);
    });
  });
};
