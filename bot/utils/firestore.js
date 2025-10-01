function getGuildDoc(db, guildId) {
  return db.collection("guilds").doc(guildId).get();
}

function setGuildDoc(db, guildId, data) {
  return db.collection("guilds").doc(guildId).set(data, { merge: true });
}

module.exports = { getGuildDoc, setGuildDoc };
