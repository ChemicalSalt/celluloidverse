const express = require("express");
const admin = require("firebase-admin");
const { body, validationResult } = require("express-validator");
const { verifySession } = require("./session");

const router = express.Router();

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

/**
 * GET plugin data
 */
router.get("/servers/:id/plugins/:plugin", verifySession, async (req, res) => {
  try {
    const { id, plugin } = req.params;
    const doc = await db.collection("guilds").doc(id).get();
    res.json(doc.exists ? doc.data().plugins?.[plugin] || {} : {});
  } catch (err) {
    console.error("[GET Plugin Error]", err);
    res.status(500).json({ error: "Failed to fetch plugin" });
  }
});

/**
 * POST plugin config (multi-language safe)
 * Keeps all existing languages and clean structure:
 * plugins: {
 *   languageSummoner: {
 *     english: {...},
 *     japanese: {...},
 *     mandarin: {...}
 *   }
 * }
 */
router.post(
  "/servers/:id/plugins/:plugin",
  verifySession,
  [
    body("enabled").optional().isBoolean(),
    body("language").optional().isString(),
    body("config").optional().isObject(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { id, plugin } = req.params;
      const { language = "mandarin", ...data } = req.body;

      const docRef = db.collection("guilds").doc(id);
      const snap = await docRef.get();
      const plugins = snap.exists ? snap.data()?.plugins || {} : {};
      const currentPlugin = plugins[plugin] || {};

      // Only update the specific language section
      const updatedPlugin = {
        ...currentPlugin,
        [language]: {
          ...(currentPlugin[language] || {}),
          ...data,
          updatedAt: new Date().toISOString(),
          enabled: true,
        },
      };

      await docRef.set(
        
        {
          plugins: {
            ...plugins,
            [plugin]: updatedPlugin,
          },
        },
        { merge: true }
      );

      res.json({ success: true, language });
    } catch (err) {
      console.error("[POST Plugin Error]", err);
      res.status(500).json({ error: "Failed to save plugin" });
    }
  }
);

/**
 * Toggle plugin globally (keeps language data untouched)
 */
router.post(
  "/servers/:id/plugins/:plugin",
  verifySession,
  [
    body("enabled").optional().isBoolean(),
    body("language").optional().isString(),
    body("config").optional().isObject(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { id, plugin } = req.params;
      const { language = "mandarin", ...data } = req.body;

      const docRef = db.collection("guilds").doc(id);
      const snap = await docRef.get();
      const plugins = snap.exists ? snap.data()?.plugins || {} : {};
      const currentPlugin = plugins[plugin] || {};

      // Only update the specific language section
      const updatedPlugin = {
        ...currentPlugin,
        [language]: {
          ...(currentPlugin[language] || {}),
          ...data,
          updatedAt: new Date().toISOString(),
          enabled: true,
        },
      };

      await docRef.set(
        {
          plugins: {
            ...plugins,
            [plugin]: updatedPlugin,
          },
        },
        { merge: true }
      );

      // ✅ Trigger immediate scheduler resync for this guild
      try {
        const { scheduleWordOfTheDay } = require("../cron/scheduler");
        scheduleWordOfTheDay(id, updatedPlugin[language], language);
        console.log(`[Plugin Update] 🔄 Rescheduled ${plugin}:${language} for guild ${id}`);
      } catch (err) {
        console.error("[Plugin Update] ❌ Scheduler reload failed:", err);
      }

      res.json({ success: true, language });
    } catch (err) {
      console.error("[POST Plugin Error]", err);
      res.status(500).json({ error: "Failed to save plugin" });
    }
  }
);


module.exports = router;
