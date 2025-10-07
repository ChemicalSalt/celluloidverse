const express = require("express");
const fetch = require("node-fetch");
const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");
const cookieParser = require("cookie-parser");

const router = express.Router();

// Env constants
const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, FRONTEND_URL, JWT_SECRET } = process.env;

// Firebase init
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

router.use(cookieParser());

// Helper: JWT session
function createSessionToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

// 1️⃣ Session check
router.get("/session", async (req, res) => {
  try {
    const token = req.cookies?.session;
    if (!token) return res.status(401).json({ error: "No session" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const userDoc = await db.collection("users").doc(decoded.userId).get();
    if (!userDoc.exists) return res.status(401).json({ error: "User not found" });

    return res.json({ id: decoded.userId, user: userDoc.data().user });
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
});

// 2️⃣ OAuth login
router.get("/login", (_req, res) => {
  const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&scope=identify%20guilds&response_type=code&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}`;
  res.redirect(url);
});

// 3️⃣ OAuth callback
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
    if (data.error) return res.status(400).send("OAuth error");

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    const userData = await userRes.json();

    await db.collection("users").doc(userData.id).set(
      {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + (data.expires_in || 0) * 1000,
        user: userData,
      },
      { merge: true }
    );

    const sessionToken = createSessionToken(userData.id);
    res.cookie("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.redirect(`${FRONTEND_URL}/dashboard`);
  } catch (err) {
    console.error(err);
    return res.status(500).send("OAuth callback failed");
  }
});

module.exports = router;
