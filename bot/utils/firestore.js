// utils/firestore.js
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
 * Ensure plugin map structure merging helper
 * Writes the plugins map at /guilds/{guildId}.plugins
 */
async function savePluginConfig(guildId, pluginKey, pluginData) {
  const now = new Date().toISOString();
  const payload = {
    plugins: {
      [pluginKey]: {
        ...pluginData,
        updatedAt: now,
      },
    },
  };
  await db.collection("guilds").doc(guildId).set(payload, { merge: true });
  return true;
}

async function getGuildPlugins(guildId) {
  const doc = await db.collection("guilds").doc(guildId).get();
  return doc.exists ? (doc.data().plugins || {}) : {};
}

module.exports = { db, savePluginConfig, getGuildPlugins };
