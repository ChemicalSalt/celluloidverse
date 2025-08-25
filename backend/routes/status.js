const express = require("express");
const admin = require("firebase-admin");
const router = express.Router();

const serviceAccount = require("../serviceAccountKey.json"); // same project as bot

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

router.get("/", async (_req, res) => {
  try {
    const doc = await db.collection("botStatus").doc("main").get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Bot status not found" });
    }
    res.json(doc.data());
  } catch (err) {
    console.error("Error fetching bot status:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
