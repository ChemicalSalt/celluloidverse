// utils/firestore.js
const admin = require("firebase-admin");

try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
} catch (e) {
  console.error("🔥 Failed to initialize Firebase Admin:", e);
}

const db = admin.firestore();

module.exports = { admin, db };
