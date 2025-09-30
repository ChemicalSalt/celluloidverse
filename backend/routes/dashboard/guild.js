const express = require("express");
const fetch = require("node-fetch");
const admin = require("firebase-admin");
const { verifySession } = require("./session");

const router = express.Router();
const BOT_TOKEN = process.env.TOKEN;

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

router.get("/servers/:guildId/channels", verifySession, async (req, res) => {
  try {
    const response = await fetch(`https://discord.com/api/v10/guilds/${req.params.guildId}/channels`, {
      headers: { Authorization: `Bot ${BOT_TOKEN}` },
    });
    if (!response.ok) return res.status(response.status).json({ error: "Failed to fetch channels" });
    const channels = await response.json();
    res.json(channels.filter((c) => c.type === 0).map((c) => ({ id: c.id, name: c.name })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch channels" });
  }
});

router.get("/servers/:id", verifySession, async (req, res) => {
  try {
    const guildRes = await fetch(`https://discord.com/api/v10/guilds/${req.params.id}`, {
      headers: { Authorization: `Bot ${BOT_TOKEN}` },
    });
    if (!guildRes.ok) return res.status(guildRes.status).json({ error: "Failed to fetch guild" });

    const guildData = await guildRes.json();
    const doc = await db.collection("guilds").doc(req.params.id).get();
    const plugins = doc.exists ? doc.data().plugins || {} : {};
    res.json({ id: guildData.id, name: guildData.name, icon: guildData.icon, plugins });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch guild info" });
  }
});

module.exports = router;
