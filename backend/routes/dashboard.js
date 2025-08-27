const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const BOT_TOKEN = process.env.TOKEN;

// ---- OAuth Login ----
router.get("/login", (req, res) => {
  const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&scope=identify%20guilds&response_type=code&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}`;
  res.redirect(url);
});

// ---- OAuth Callback ----
router.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("No code provided");

  try {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      scope: "identify guilds",
    });

    // Exchange code for access token
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      body: params,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const data = await tokenRes.json();
    if (data.error) return res.status(400).send("OAuth error: " + data.error);

    // Fetch user info
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    const user = await userRes.json();
    console.log("OAuth success for user:", user.username);

    // Redirect to frontend (Vite local)
res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${data.access_token}`);
  } catch (err) {
    console.error("OAuth callback failed:", err);
    res.status(500).send("OAuth callback failed");
  }
});

// ---- Fetch user's servers & bot presence ----
router.get("/servers", async (req, res) => {
  const accessToken = req.headers.authorization?.split(" ")[1];
  if (!accessToken) return res.status(401).json({ error: "No token provided" });

  try {
    // 1️⃣ Get user's guilds
    const userGuildRes = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userGuilds = await userGuildRes.json();

    // 2️⃣ Get bot's guilds
    const botGuildRes = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: { Authorization: `Bot ${BOT_TOKEN}` },
    });
    const botGuilds = await botGuildRes.json();
    const botGuildIds = botGuilds.map(g => g.id);

    // 3️⃣ Filter guilds where user can manage bot (MANAGE_GUILD)
    const manageableGuilds = userGuilds.filter(g => (g.permissions & 0x20) === 0x20);

    // 4️⃣ Map guild info
    const guildsWithInfo = manageableGuilds.map(g => ({
      id: g.id,
      name: g.name,
      icon: g.icon,
      hasBot: botGuildIds.includes(g.id),
      canManage: (g.permissions & 0x20) === 0x20,
      invite_link: `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=bot&guild_id=${g.id}&permissions=8`,
    }));

    res.json(guildsWithInfo);
  } catch (err) {
    console.error("Failed to fetch guilds:", err);
    res.status(500).json({ error: "Failed to fetch guilds" });
  }
});

// ---- Save messages/settings for a server ----
router.post("/servers/:id/messages", async (req, res) => {
  const { id } = req.params;
  const messages = req.body;

  // TODO: Save to Firestore/DB
  console.log(`Save messages for server ${id}:`, messages);

  res.json({ success: true });
});

module.exports = router;
