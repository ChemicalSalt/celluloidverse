// routes/dashboard.js
const express = require("express");
const fetch = require("node-fetch");
const jwt = require("jsonwebtoken");
const router = express.Router();
const admin = require("firebase-admin");

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const BOT_TOKEN = process.env.TOKEN; // bot token for bot-specific endpoints
const JWT_SECRET = process.env.JWT_SECRET || "change_this_in_prod";

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

/**
 * Helper: create session JWT (contains only userId)
 */
function createSessionToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Helper: verify session middleware
 */
function verifySession(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "No token provided" });
  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.session = decoded; // { userId }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid session" });
  }
}

/**
 * Helper: refresh Discord access token using stored refresh_token
 */
async function refreshDiscordToken(refreshToken) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: refreshToken
  });

  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    body: params,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  const data = await tokenRes.json();
  if (data.error) throw new Error("Failed to refresh token: " + JSON.stringify(data));
  return data;
}

/* ----------------------
   OAuth Login & Callback
   ---------------------- */

router.get("/login", async (req, res) => {
  const userId = req.query.userId;
  if (userId) {
    const userDoc = await db.collection("users").doc(userId).get();
    if (userDoc.exists && userDoc.data().access_token) {
      const sessionToken = createSessionToken(userId);
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?session=${sessionToken}`);
    }
  }

  const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&scope=identify%20guilds&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  return res.redirect(url);
});

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
      scope: "identify guilds"
    });

    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      body: params,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const data = await tokenRes.json();
    if (data.error) {
      console.error("OAuth token error:", data);
      return res.status(400).send("OAuth error");
    }

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    const userData = await userRes.json();

    await db.collection("users").doc(userData.id).set({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + (data.expires_in || 0) * 1000,
      token_type: data.token_type,
      user: userData
    }, { merge: true });

    const sessionToken = createSessionToken(userData.id);
    return res.redirect(`${process.env.FRONTEND_URL}/dashboard?session=${sessionToken}`);
  } catch (err) {
    console.error("OAuth callback failed:", err);
    return res.status(500).send("OAuth callback failed");
  }
});

/* ----------------------
   Protected API routes
   ---------------------- */

router.get("/servers", verifySession, async (req, res) => {
  const userId = req.session.userId;
  try {
    const userDocRef = db.collection("users").doc(userId);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) return res.status(401).json({ error: "User not found" });

    let { access_token, refresh_token, expires_at } = userDoc.data();

    if (!access_token || (expires_at && Date.now() > expires_at - 30_000)) {
      if (!refresh_token) return res.status(401).json({ error: "No refresh token, please re-authenticate" });
      try {
        const refreshed = await refreshDiscordToken(refresh_token);
        access_token = refreshed.access_token;
        refresh_token = refreshed.refresh_token || refresh_token;
        expires_at = Date.now() + (refreshed.expires_in || 0) * 1000;
        await userDocRef.set({ access_token, refresh_token, expires_at }, { merge: true });
      } catch (err) {
        console.error("Failed to refresh token:", err);
        return res.status(401).json({ error: "Failed to refresh token" });
      }
    }

    const guildRes = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const userGuilds = await guildRes.json();

    // Enrich with hasBot: check Firestore and fallback to Discord API
    const enrichedGuilds = await Promise.all(userGuilds.map(async (g) => {
      let hasBot = false;
      const doc = await db.collection("guilds").doc(g.id).get();
      if (doc.exists) {
        hasBot = true;
      } else {
        // fallback: check if bot is in guild
        try {
          const botCheck = await fetch(`https://discord.com/api/v10/guilds/${g.id}`, {
            headers: { Authorization: `Bot ${BOT_TOKEN}` }
          });
          hasBot = botCheck.ok;
        } catch (_) {
          hasBot = false;
        }
      }
      return {
        id: g.id,
        name: g.name,
        icon: g.icon,
        hasBot
      };
    }));

    return res.json(enrichedGuilds);
  } catch (err) {
    console.error("Failed to fetch user servers:", err);
    return res.status(500).json({ error: "Failed to fetch user servers" });
  }
});

/* Plugin routes */

router.get("/servers/:id/plugins/:plugin", verifySession, async (req, res) => {
  const { id, plugin } = req.params;
  try {
    const doc = await db.collection("guilds").doc(id).get();
    res.json(doc.exists ? doc.data().plugins?.[plugin] || {} : {});
  } catch (err) {
    console.error("Failed to fetch plugin:", err);
    res.status(500).json({ error: "Failed to fetch plugin" });
  }
});

router.post("/servers/:id/plugins/:plugin", verifySession, async (req, res) => {
  const { id, plugin } = req.params;
  const payload = req.body;
  try {
    const docRef = db.collection("guilds").doc(id);
    const existingDoc = await docRef.get();
    const existingPlugins = existingDoc.exists ? existingDoc.data()?.plugins || {} : {};

    await docRef.set({
      plugins: {
        ...existingPlugins,
        [plugin]: { ...payload, updatedAt: new Date().toISOString() }
      }
    }, { merge: true });

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to save plugin:", err);
    res.status(500).json({ error: "Failed to save plugin" });
  }
});

router.post("/servers/:id/plugins/:plugin/toggle", verifySession, async (req, res) => {
  const { id, plugin } = req.params;
  const { enabled } = req.body;
  try {
    const docRef = db.collection("guilds").doc(id);
    const doc = await docRef.get();
    const existingPlugins = doc.exists ? doc.data()?.plugins || {} : {};

    await docRef.set({
      plugins: {
        ...existingPlugins,
        [plugin]: { ...(existingPlugins[plugin] || {}), enabled: !!enabled, updatedAt: new Date().toISOString() }
      }
    }, { merge: true });

    res.json({ success: true, enabled });
  } catch (err) {
    console.error("Failed to toggle plugin:", err);
    res.status(500).json({ error: "Failed to toggle plugin" });
  }
});

/* Bot-backed endpoints */

router.get("/servers/:guildId/channels", verifySession, async (req, res) => {
  const guildId = req.params.guildId;
  try {
    const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      headers: { Authorization: `Bot ${BOT_TOKEN}` },
    });
    if (!response.ok) {
      const txt = await response.text();
      console.error("Guild channels fetch failed:", response.status, txt);
      return res.status(response.status).json({ error: "Failed to fetch channels" });
    }
    const channels = await response.json();
    res.json(channels.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name })));
  } catch (err) {
    console.error("Failed to fetch channels:", err);
    res.status(500).json({ error: "Failed to fetch channels" });
  }
});

router.get("/servers/:id", verifySession, async (req, res) => {
  const { id } = req.params;
  try {
    const guildRes = await fetch(`https://discord.com/api/v10/guilds/${id}`, {
      headers: { Authorization: `Bot ${BOT_TOKEN}` },
    });
    if (!guildRes.ok) {
      const txt = await guildRes.text();
      console.error("Fetch guild info failed:", guildRes.status, txt);
      return res.status(guildRes.status).json({ error: "Failed to fetch guild info" });
    }

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
