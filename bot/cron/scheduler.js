const { db } = require("../utils/firestore");
const { scheduleWordOfTheDay } = require("../plugins/wotd");

function scheduleAll(client) {
  db.collection("guilds").get().then(snapshot => {
    snapshot.docs.forEach(doc => {
      const gid = doc.id;
      const plugins = doc.data()?.plugins || {};
      const lang = plugins.language || plugins.wotd;
      if (lang?.enabled) scheduleWordOfTheDay(client, gid, lang);
    });
  }).catch(err => {
    console.error("🔥 Error scheduling all WOTD:", err);
  });
}

module.exports = { scheduleAll };
