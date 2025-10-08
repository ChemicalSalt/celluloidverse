const express = require("express");
const fetch = require("node-fetch");
const admin = require("firebase-admin");
const { verifySession, refreshDiscordToken } = require("./session");

const router = express.Router();
const BOT_TOKEN = process.env.TOKEN;

// Initialize Firebase only once
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

// ------------------------------
// GET: All servers (guilds)
// ------------------------------
router.get("/", verifySession, async (req, res) => {
  const userId = req.session.userId;

  try {
    const userDocRef = db.collection("users").doc(userId);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) return res.status(401).json({ error: "User not found" });

    let { access_token, refresh_token, expires_at } = userDoc.data();

    // 🔹 Auto-refresh token if expired or close to expiry (within 30s)
    if (!access_token || (expires_at && Date.now() > expires_at - 30_000)) {
      if (!refresh_token) return res.status(401).json({ error: "Re-authenticate" });
      try {
        const refreshed = await refreshDiscordToken(refresh_token);
        access_token = refreshed.access_token;
        refresh_token = refreshed.refresh_token || refresh_token;
        expires_at = Date.now() + (refreshed.expires_in || 0) * 1000;
        await userDocRef.set({ access_token, refresh_token, expires_at }, { merge: true });
      } catch (err) {
        console.error("Token refresh failed:", err);
        return res.status(401).json({ error: "Re-authenticate" });
      }
    }

    // 🔹 Get user guilds
    const guildRes = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!guildRes.ok) {
      return res.status(guildRes.status).json({ error: "Failed to fetch user guilds" });
    }

    const userGuilds = await guildRes.json();

    // 🔹 For each guild, check if the bot is present
    const enriched = await Promise.all(
      userGuilds.map(async (g) => {
        let hasBot = false;

        // Quick check in Firestore (cached)
        const doc = await db.collection("guilds").doc(g.id).get();
        if (doc.exists) {
          hasBot = true;
        } else {
          // Verify via Discord API
          const botCheck = await fetch(`https://discord.com/api/v10/guilds/${g.id}`, {
            headers: { Authorization: `Bot ${BOT_TOKEN}` },
          });
          hasBot = botCheck.ok;
        }

        return {
          id: g.id,
          name: g.name,
          icon: g.icon,
          hasBot,
        };
      })
    );

    return res.json(enriched);
  } catch (err) {
    console.error("Fetch servers failed:", err);
    return res.status(500).json({ error: "Failed to fetch servers" });
  }
});

// ------------------------------
// GET: All text channels of a guild
// ------------------------------
router.get("/:id/channels", verifySession, async (req, res) => {
  const guildId = req.params.id;
  try {
    const channelsRes = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/channels`,
      { headers: { Authorization: `Bot ${BOT_TOKEN}` } }
    );

    if (!channelsRes.ok) {
      return res
        .status(channelsRes.status)
        .json({ error: `Failed to fetch channels (${channelsRes.status})` });
    }

    const channels = await channelsRes.json();

    // 🔹 Filter only text channels
    const textChannels = channels.filter((ch) => ch.type === 0);
    return res.json(textChannels);
  } catch (err) {
    console.error("Fetch channels failed:", err);
    return res.status(500).json({ error: "Failed to fetch channels" });
  }
});

// ------------------------------
// GET: Single guild info from Firestore
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
    console.error("Fetch server by ID failed:", err);
    return res.status(500).json({ error: "Failed to fetch server details" });
  }
});

module.exports = router;
