const express = require("express");
const admin = require("firebase-admin");
const { body, validationResult } = require("express-validator");
const { verifySession } = require("./session");

const router = express.Router();

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

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

// ✅ SAVE / MERGE MULTI-LANGUAGE
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
      const existing = await docRef.get();
      const plugins = existing.exists ? existing.data()?.plugins || {} : {};
      const existingPlugin = plugins[plugin] || {};

      await docRef.set(
        {
          plugins: {
            ...plugins,
            [plugin]: {
              ...existingPlugin,
              [language]: {
                ...existingPlugin[language],
                ...data,
                updatedAt: new Date().toISOString(),
                enabled: true,
              },
              enabled: true,
            },
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

router.post(
  "/servers/:id/plugins/:plugin/toggle",
  verifySession,
  [body("enabled").isBoolean()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { id, plugin } = req.params;
      const docRef = db.collection("guilds").doc(id);
      const doc = await docRef.get();
      const plugins = doc.exists ? doc.data()?.plugins || {} : {};

      await docRef.set(
        {
          plugins: {
            ...plugins,
            [plugin]: {
              ...(plugins[plugin] || {}),
              enabled: !!req.body.enabled,
              updatedAt: new Date().toISOString(),
            },
          },
        },
        { merge: true }
      );
      res.json({ success: true, enabled: req.body.enabled });
    } catch (err) {
      res.status(500).json({ error: "Failed to toggle plugin" });
    }
  }
);

module.exports = router;
