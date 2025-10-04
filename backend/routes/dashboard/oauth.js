const express = require("express");
const fetch = require("node-fetch");
const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");
const cookieParser = require("cookie-parser");

const router = express.Router();

// --- Constants from environment ---
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const FRONTEND_URL = process.env.FRONTEND_URL;
const JWT_SECRET = process.env.JWT_SECRET;

// --- Firebase setup ---
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

// --- Middleware ---
router.use(cookieParser());

// --- Utility: Create JWT session token ---
function createSessionToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

// ✅ 1️⃣ Check session silently (for frontend)
router.get("/session", async (req, res) => {
  try {
    const token = req.cookies?.session;
    if (!token) return res.status(401).json({ error: "No session" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const userDoc = await db.collection("users").doc(decoded.userId).get();
    if (!userDoc.exists) return res.status(401).json({ error: "User not found" });

    return res.json({ id: decoded.userId, user: userDoc.data().user });
  } catch (err) {
    console.error("Session check failed:", err);
    return res.status(401).json({ error: "Invalid or expired session" });
  }
});

// ✅ 2️⃣ Start Discord OAuth flow directly
router.get("/auth/url", (req, res) => {
  const redirectUri = encodeURIComponent(REDIRECT_URI);
  const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&scope=identify%20guilds&redirect_uri=${redirectUri}`;
  return res.redirect(url);
});

// ✅ 3️⃣ Login redirect (optional entry point)
router.get("/login", async (req, res) => {
  const userId = req.query.userId;
  if (userId) {
    const userDoc = await db.collection("users").doc(userId).get();
    if (userDoc.exists && userDoc.data().access_token) {
      const sessionToken = createSessionToken(userId);
      res.cookie("session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return res.redirect(`${FRONTEND_URL}/dashboard`);
    }
  }

  const redirectUri = encodeURIComponent(REDIRECT_URI);
  const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&scope=identify%20guilds&response_type=code&redirect_uri=${redirectUri}`;
  return res.redirect(url);
});

// ✅ 4️⃣ OAuth callback — handles Discord login
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

    // Exchange code for tokens
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      body: params,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const data = await tokenRes.json();
    if (data.error) return res.status(400).send("OAuth error");

    // Get user info
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    const userData = await userRes.json();

    // Store tokens & user in Firestore
    await db.collection("users").doc(userData.id).set(
      {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + (data.expires_in || 0) * 1000,
        user: userData,
      },
      { merge: true }
    );

    // Create session cookie
    const sessionToken = createSessionToken(userData.id);
    res.cookie("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Redirect to dashboard after success
    return res.redirect(`${FRONTEND_URL}/dashboard`);
  } catch (err) {
    console.error("OAuth callback failed", err);
    return res.status(500).send("OAuth callback failed");
  }
});

module.exports = router;
