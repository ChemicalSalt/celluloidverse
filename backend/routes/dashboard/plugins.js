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
    res.status(500).json({ error: "Failed to fetch plugin" });
  }
});

router.post(
  "/servers/:id/plugins/:plugin",
  verifySession,
  [body("enabled").optional().isBoolean(), body("config").optional().isObject()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { id, plugin } = req.params;
      const docRef = db.collection("guilds").doc(id);
      const existing = await docRef.get();
      const plugins = existing.exists ? existing.data()?.plugins || {} : {};

      await docRef.set(
        {
          plugins: {
            ...plugins,
            [plugin]: { ...req.body, updatedAt: new Date().toISOString() },
          },
        },
        { merge: true }
      );
      res.json({ success: true });
    } catch (err) {
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
