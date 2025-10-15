const express = require("express");
const fetch = require("node-fetch");
const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");
const cookieParser = require("cookie-parser");

const router = express.Router();

const {
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI,
  FRONTEND_URL,
  JWT_SECRET,
} = process.env;

// ------------------------------
// Firebase setup
// ------------------------------
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

router.use(cookieParser());

// ------------------------------
// Helpers
// ------------------------------
function createSessionToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

async function refreshAccessToken(userId, refreshToken) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    body: params,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const data = await tokenRes.json();

  if (!tokenRes.ok || data.error) {
    console.error("Discord token refresh failed:", data);
    throw new Error(data.error_description || "Failed to refresh Discord token");
  }

  const expires_at = Date.now() + (data.expires_in || 0) * 1000;

  await db.collection("users").doc(userId).set(
    {
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken,
      expires_at,
    },
    { merge: true }
  );

  return data.access_token;
}

// ------------------------------
// 1️⃣ SESSION CHECK
// ------------------------------
router.get("/session", async (req, res) => {
  try {
    const token = req.cookies?.session;
    if (!token) return res.status(401).json({ error: "No session" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const userRef = db.collection("users").doc(decoded.userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(401).json({ error: "User not found" });

    let userData = userDoc.data();

    // 🔹 Auto-refresh Discord access token if about to expire
    if (userData.expires_at && Date.now() > userData.expires_at - 60_000) {
      try {
        const newAccess = await refreshAccessToken(decoded.userId, userData.refresh_token);
        userData.access_token = newAccess;
      } catch (err) {
        console.error("Token refresh failed:", err);
        return res.status(401).json({ error: "Session expired, please log in again" });
      }
    }

    // 🔹 Renew the JWT cookie each time user visits
    res.cookie("session", createSessionToken(decoded.userId), {
      httpOnly: true,
      secure: true,               // keep secure for live HTTPS
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });

    return res.json({ id: decoded.userId, user: userData.user });
  } catch (err) {
    console.error("Session check failed:", err);
    return res.status(401).json({ error: "Invalid or expired session" });
  }
});

// ------------------------------
// 2️⃣ DISCORD LOGIN (redirect)
// ------------------------------
router.get("/login", (_req, res) => {
  const url = new URL("https://discord.com/api/oauth2/authorize");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("scope", "identify guilds");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  res.redirect(url.toString());
});

// ------------------------------
// 3️⃣ DISCORD CALLBACK
// ------------------------------
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
    if (!tokenRes.ok || data.error) {
      console.error("OAuth token exchange failed:", data);
      return res.status(400).send("OAuth failed");
    }

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    const userData = await userRes.json();

    const expires_at = Date.now() + (data.expires_in || 0) * 1000;

    await db.collection("users").doc(userData.id).set(
      {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at,
        user: userData,
      },
      { merge: true }
    );

    const sessionToken = createSessionToken(userData.id);

    res.cookie("session", sessionToken, {
      httpOnly: true,
      secure: true,               // keep secure for live HTTPS
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    // ✅ Redirect user to dashboard (logged in)
    return res.redirect(`${FRONTEND_URL}/dashboard/addbot`);
  } catch (err) {
    console.error("OAuth callback failed:", err);
    return res.status(500).send("OAuth callback failed");
  }
});

module.exports = router;
