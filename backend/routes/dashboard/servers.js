const express = require("express");
const fetch = require("node-fetch");
const admin = require("firebase-admin");
const { verifySession, refreshDiscordToken } = require("./session");

const router = express.Router();
const BOT_TOKEN = process.env.TOKEN;

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

// ------------------------------
// Get all servers (guilds)
// ------------------------------
router.get("/", verifySession, async (req, res) => {
  const userId = req.session.userId;
  try {
    const userDocRef = db.collection("users").doc(userId);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) return res.status(401).json({ error: "User not found" });

    let { access_token, refresh_token, expires_at } = userDoc.data();

    // refresh if expired
    if (!access_token || (expires_at && Date.now() > expires_at - 30_000)) {
      if (!refresh_token) return res.status(401).json({ error: "Re-authenticate" });
      const refreshed = await refreshDiscordToken(refresh_token);
      access_token = refreshed.access_token;
      refresh_token = refreshed.refresh_token || refresh_token;
      expires_at = Date.now() + (refreshed.expires_in || 0) * 1000;
      await userDocRef.set({ access_token, refresh_token, expires_at }, { merge: true });
    }

    // get user guilds
    const guildRes = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const userGuilds = await guildRes.json();

    const enriched = await Promise.all(
      userGuilds.map(async (g) => {
        let hasBot = false;
        const doc = await db.collection("guilds").doc(g.id).get();
        if (doc.exists) {
          hasBot = true;
        } else {
          const botCheck = await fetch(`https://discord.com/api/v10/guilds/${g.id}`, {
            headers: { Authorization: `Bot ${BOT_TOKEN}` },
          });
          hasBot = botCheck.ok;
        }
        return { id: g.id, name: g.name, icon: g.icon, hasBot };
      })
    );

    return res.json(enriched);
  } catch (err) {
    console.error("Fetch servers failed", err);
    return res.status(500).json({ error: "Failed to fetch servers" });
  }
});
// ------------------------------
// Get all channels of a server
// ------------------------------
router.get("/:id/channels", verifySession, async (req, res) => {
  const guildId = req.params.id;
  try {
    const channelsRes = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/channels`,
      { headers: { Authorization: `Bot ${BOT_TOKEN}` } }
    );

    if (!channelsRes.ok) {
      return res.status(channelsRes.status).json({ error: "Failed to fetch channels" });
    }

    const channels = await channelsRes.json();
    return res.json(channels);
  } catch (err) {
    console.error("Fetch channels failed", err);
    return res.status(500).json({ error: "Failed to fetch channels" });
  }
});

// ------------------------------
// Get single server by ID
// ------------------------------
router.get("/:id", verifySession, async (req, res) => {
  try {
    const guildId = req.params.id;
    const doc = await db.collection("guilds").doc(guildId).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Server not found" });
    }

    return res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error("Fetch server by ID failed", err);
    return res.status(500).json({ error: "Failed to fetch server details" });
  }
});

module.exports = router;
