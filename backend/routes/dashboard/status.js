const express = require("express");
const admin = require("firebase-admin");
const router = express.Router();

const rateLimit = require("express-rate-limit");

const statusLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 60, // 60 requests per IP per minute
  message: { error: "Too many requests, please try again later." }
});

router.use(statusLimiter);

// Initialize Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

// GET bot status
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
