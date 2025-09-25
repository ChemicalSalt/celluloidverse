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
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

// ---- OAuth Login ----
router.get("/login", async (req, res) => {
  const userId = req.query.userId;
  if (userId) {
    const userDoc = await db.collection("users").doc(userId).get();
    if (userDoc.exists && userDoc.data().access_token) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/dashboard?token=${userDoc.data().access_token}`
      );
    }
  }
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

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    const userData = await userRes.json();

    await db.collection("users").doc(userData.id).set(
      {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        token_type: data.token_type,
        user: userData,
      },
      { merge: true }
    );

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${data.access_token}`);
  } catch (err) {
    console.error("OAuth callback failed:", err);
    res.status(500).send("OAuth callback failed");
  }
});

// ---- Fetch plugin config ----
router.get("/servers/:id/plugins/:plugin", async (req, res) => {
  const { id, plugin } = req.params;
  try {
    const doc = await db.collection("guilds").doc(id).get();
    const data = doc.exists ? doc.data().plugins?.[plugin] || {} : {};
    res.json(data);
  } catch (err) {
    console.error("Failed to fetch plugin:", err);
    res.status(500).json({ error: "Failed to fetch plugin" });
  }
});


// ---- Save a plugin config ----
router.post("/servers/:id/plugins/:plugin", async (req, res) => {
  const { id, plugin } = req.params;
  const payload = req.body;

  // --- 24-hour time validation for language plugin ---
  if (plugin === "language" && payload.time) {
    const isValidTime = /^([01]\d|2[0-3]):([0-5]\d)$/.test(payload.time);
    if (!isValidTime) {
      return res.status(400).json({ 
        error: "Invalid time format. Use HH:MM (24-hour format)" 
      });
    }
  }

  console.log("POST hit backend");
  console.log("Params:", req.params);
  console.log("Body:", payload);

  try {
    const docRef = db.collection("guilds").doc(id);
    const existingDoc = await docRef.get();
    const existingPlugins = existingDoc.exists ? existingDoc.data()?.plugins || {} : {};

    // Merge plugin config safely
    await docRef.set(
      { plugins: { ...existingPlugins, [plugin]: payload } },
      { merge: true }
    );

    console.log(`Successfully saved "${plugin}" for server ${id}`);
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to save plugin:", err);
    res.status(500).json({ error: "Failed to save plugin" });
  }
});

// ---- Fetch channels for a guild ----
router.get("/servers/:guildId/channels", async (req, res) => {
  const guildId = req.params.guildId;
  try {
    const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      headers: { Authorization: `Bot ${TOKEN}` },
    });
    const channels = await response.json();
    const textChannels = channels.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name }));
    res.json(textChannels);
  } catch (err) {
    console.error("Failed to fetch channels:", err);
    res.status(500).json({ error: "Failed to fetch channels" });
  }
});

// ---- Fetch server info + all plugins ----
router.get("/servers/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const guildRes = await fetch(`https://discord.com/api/v10/guilds/${id}`, {
      headers: { Authorization: `Bot ${TOKEN}` },
    });
    if (!guildRes.ok) return res.status(guildRes.status).json({ error: "Failed to fetch guild info" });

    const guildData = await guildRes.json();
    const doc = await db.collection("guilds").doc(id).get();
    const plugins = doc.exists ? doc.data().plugins || {} : {};

    res.json({ id: guildData.id, name: guildData.name, icon: guildData.icon, plugins });
  } catch (err) {
    console.error("Failed to fetch server info:", err);
    res.status(500).json({ error: "Failed to fetch server info" });
  }
});

module.exports = router;
