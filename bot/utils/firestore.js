// bot/utils/firestore.js
const admin = require("firebase-admin");

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error("FIREBASE_SERVICE_ACCOUNT env missing!");
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

/**
 * Save plugin config for a guild (fixed safe nested merge)
 */
async function savePluginConfig(guildId, pluginKey, pluginData) {
  const now = new Date().toISOString();

  const payload = {
    ...pluginData,
    updatedAt: now,
  };

  // Write ONLY to the nested plugin path (avoids root pollution)
  await db
    .collection("guilds")
    .doc(guildId)
    .set({ [`plugins.${pluginKey}`]: payload }, { merge: true });

  return true;
}

/**
 * Fetch all plugins for a guild
 */
async function getGuildPlugins(guildId) {
  const doc = await db.collection("guilds").doc(guildId).get();
  return doc.exists ? (doc.data().plugins || {}) : {};
}

module.exports = { db, savePluginConfig, getGuildPlugins };
