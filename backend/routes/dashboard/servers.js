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

    // Refresh if expired
    if (!access_token || (expires_at && Date.now() > expires_at - 30_000)) {
      if (!refresh_token) return res.status(401).json({ error: "Re-authenticate" });
      const refreshed = await refreshDiscordToken(refresh_token);
      access_token = refreshed.access_token;
      refresh_token = refreshed.refresh_token || refresh_token;
      expires_at = Date.now() + (refreshed.expires_in || 0) * 1000;
      await userDocRef.set({ access_token, refresh_token, expires_at }, { merge: true });
    }

    // User's guilds
    const guildRes = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!guildRes.ok) return res.status(403).json({ error: "Failed to fetch guilds" });
    const userGuilds = await guildRes.json();

    // Only manageable guilds
    const manageableGuilds = userGuilds.filter(
      (g) => (g.permissions & 0x20) === 0x20
    );

    // Bot's guilds
    const botGuildsRes = await fetch("https://discord.com/api/v10/users/@me/guilds", {
      headers: { Authorization: `Bot ${BOT_TOKEN}` },
    });
    const botGuilds = botGuildsRes.ok ? await botGuildsRes.json() : [];
    const botGuildIds = new Set(botGuilds.map((bg) => bg.id));

    const enriched = manageableGuilds.map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.icon,
      hasBot: botGuildIds.has(g.id),
    }));

    return res.json(enriched);
  } catch (err) {
    console.error("Fetch servers failed:", err);
    return res.status(500).json({ error: "Failed to fetch servers" });
  }
});

// ------------------------------
// Get channels of a server
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
    const textChannels = channels.filter((ch) => ch.type === 0);
    return res.json(textChannels);
  } catch (err) {
    console.error("Fetch channels failed:", err);
    return res.status(500).json({ error: "Failed to fetch channels" });
  }
});

// ------------------------------
// ✅ Get single server by ID (live check + Firestore fallback)
// ------------------------------
router.get("/:id", verifySession, async (req, res) => {
  const guildId = req.params.id;

  try {
    // Check Firestore first
    const guildDoc = await db.collection("guilds").doc(guildId).get();

    // If exists in Firestore → merge live bot presence
    if (guildDoc.exists) {
      // Confirm bot is still in that guild
      const botGuildsRes = await fetch("https://discord.com/api/v10/users/@me/guilds", {
        headers: { Authorization: `Bot ${BOT_TOKEN}` },
      });
      const botGuilds = botGuildsRes.ok ? await botGuildsRes.json() : [];
      const isInGuild = botGuilds.some((g) => g.id === guildId);

      return res.json({
        id: guildId,
        ...guildDoc.data(),
        hasBot: isInGuild,
      });
    }

    // If not in Firestore → check Discord directly
    const botGuildRes = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}`,
      { headers: { Authorization: `Bot ${BOT_TOKEN}` } }
    );

    if (botGuildRes.ok) {
      const guildData = await botGuildRes.json();
      return res.json({
        id: guildData.id,
        name: guildData.name,
        icon: guildData.icon,
        hasBot: true,
      });
    }

    // Not in Firestore and bot not in guild
    return res.status(404).json({ error: "Bot not in this server", hasBot: false });
  } catch (err) {
    console.error("Fetch server by ID failed:", err);
    return res.status(500).json({ error: "Failed to fetch server details" });
  }
});

module.exports = router;
