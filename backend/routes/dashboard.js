const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();
const admin = require("firebase-admin");
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const TOKEN = process.env.TOKEN;

// Initialize Firebase once
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

// --- Initialize Discord client (required for channels) ---
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
client.login(TOKEN);

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

    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      body: params,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const data = await tokenRes.json();
    if (data.error) return res.status(400).send("OAuth error: " + data.error);

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
    const userGuildRes = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userGuilds = await userGuildRes.json();

    const botGuildRes = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: { Authorization: `Bot ${TOKEN}` },
    });
    const botGuilds = await botGuildRes.json();
    const botGuildIds = botGuilds.map(g => g.id);

    const manageableGuilds = userGuilds.filter(g => (g.permissions & 0x20) === 0x20);

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

// ---- Fetch saved messages for a server ----
router.get("/servers/:id/messages", async (req, res) => {
  const { id } = req.params;

  try {
    const doc = await db.collection("guilds").doc(id).get();
    if (!doc.exists) return res.json({ plugins: {} });

    res.json(doc.data());
  } catch (err) {
    console.error("Failed to fetch messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// ---- Save messages/settings for a server ----
router.post("/servers/:id/messages", async (req, res) => {
  const { id } = req.params;
  const { welcome, farewell } = req.body;

  try {
    const docRef = db.collection("guilds").doc(id);
    const doc = await docRef.get();
    const currentData = doc.data() || {};

    await docRef.set({
      plugins: {
        welcome: {
          enabled: welcome?.enabled ?? true,
          channelId: welcome?.channelId ?? currentData.plugins?.welcome?.channelId ?? null,
          serverMessage: welcome?.serverMessage ?? currentData.plugins?.welcome?.serverMessage ?? "Welcome {user} to {server}!",
          dmMessage: welcome?.dmMessage ?? currentData.plugins?.welcome?.dmMessage ?? "",
        },
        farewell: {
          enabled: farewell?.enabled ?? true,
          channelId: farewell?.channelId ?? currentData.plugins?.farewell?.channelId ?? null,
          serverMessage: farewell?.serverMessage ?? currentData.plugins?.farewell?.serverMessage ?? "Goodbye {user} from {server}!",
          dmMessage: farewell?.dmMessage ?? currentData.plugins?.farewell?.dmMessage ?? "",
        },
      },
    }, { merge: true });

    console.log(`Saved messages for server ${id} to Firestore`);
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to save messages:", err);
    res.status(500).json({ error: "Failed to save messages" });
  }
});

// ---- Fetch text channels for a guild ----
router.get("/guilds/:guildId/channels", async (req, res) => {
  const guildId = req.params.guildId;

  try {
    const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      headers: { Authorization: `Bot ${TOKEN}` },
    });
    const channels = await response.json();

    // filter text channels only
    const textChannels = channels.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name }));
    res.json(textChannels);
  } catch (err) {
    console.error("Failed to fetch channels:", err);
    res.status(500).json({ error: "Failed to fetch channels" });
  }
});


module.exports = router;
