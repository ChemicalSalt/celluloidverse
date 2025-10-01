// firestore.js
async function setGuildDoc(db, guildId, data) {
  await db.collection("guilds").doc(guildId).set(data, { merge: true });
}

module.exports = { setGuildDoc };
