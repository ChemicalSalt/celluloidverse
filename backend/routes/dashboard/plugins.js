const express = require("express");
const admin = require("firebase-admin");
const { body, validationResult } = require("express-validator");
const { verifySession } = require("./session");
const moment = require("moment-timezone"); 

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
 * POST plugin config — unified structure under plugins.language
 */
router.post(
  "/servers/:id/plugins/:plugin",
  verifySession,
  [
    body("enabled").optional().isBoolean(),
    body("language").optional().isString(),
    body("config").optional().isObject(),
    body("time").optional().isString(),
    body("timezone").optional().isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { id, plugin } = req.params;
      const { language = "mandarin", time, timezone, ...data } = req.body;

      // ✅ compute utcTime only if time + timezone are present
      let utcTime = null;
      if (time && timezone) {
        const localMoment = moment.tz(time, "HH:mm", timezone);
        utcTime = localMoment.clone().utc().format("HH:mm");
      }

      const docRef = db.collection("guilds").doc(id);
      const snap = await docRef.get();
      const plugins = snap.exists ? snap.data()?.plugins || {} : {};
      const currentLanguagePlugins = plugins.language || {};

      const updatedLanguagePlugins = {
        ...currentLanguagePlugins,
        [language]: {
          ...(currentLanguagePlugins[language] || {}),
          ...data,
          time: time || currentLanguagePlugins[language]?.time,
          timezone: timezone || currentLanguagePlugins[language]?.timezone,
          utcTime: utcTime || currentLanguagePlugins[language]?.utcTime,
          updatedAt: new Date().toISOString(),
          enabled: typeof data.enabled === "boolean" ? data.enabled : true,
        },
      };

      await docRef.set(
        {
          plugins: {
            ...plugins,
            language: updatedLanguagePlugins,
          },
        },
        { merge: true }
      );

      res.json({ success: true, language, utcTime });
    } catch (err) {
      console.error("[POST Plugin Error]", err);
      res.status(500).json({ error: "Failed to save plugin" });
    }
  }
);

/**
 * Toggle plugin globally (keeps individual languages untouched)
 */
router.post(
  "/servers/:id/plugins/:plugin/toggle",
  verifySession,
  [body("enabled").optional().isBoolean()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { id } = req.params;
      const { enabled } = req.body;

      const docRef = db.collection("guilds").doc(id);
      const snap = await docRef.get();
      const plugins = snap.exists ? snap.data()?.plugins || {} : {};
      const currentLanguage = plugins.language || {};

      const updatedLanguage = {
        ...currentLanguage,
        globalEnabled: typeof enabled === "boolean" ? enabled : true,
      };

      await docRef.set(
        {
          plugins: {
            ...plugins,
            language: updatedLanguage,
          },
        },
        { merge: true }
      );

      res.json({ success: true, enabled: updatedLanguage.globalEnabled });
    } catch (err) {
      console.error("[Toggle Plugin Error]", err);
      res.status(500).json({ error: "Failed to toggle plugin" });
    }
  }
);

router.post("/servers/:id/plugins/scheduler", verifySession, async (req, res) => {
    console.log("Scheduler POST hit", req.params.id, req.body);
    try {
      const { id } = req.params;
      const { channelId, message, date, time } = req.body;

      if (!channelId || !message || !date || !time) {
        return res.status(400).json({ error: "Missing fields" });
      }

await db.collection("scheduledMessages").add({
    serverId: id,
    channelId,
    message,
    date,
    time,
    sent: false,
    createdAt: new Date(),
});


      res.json({ success: true });
    } catch (err) {
      console.error("[Scheduler Save Error]", err);
      res.status(500).json({ error: "Failed to save schedule" });
    }
  }
);

module.exports = router;
