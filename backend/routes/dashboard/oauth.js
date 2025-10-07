// backend/routes/dashboard/oauth.js
const express = require("express");
const fetch = require("node-fetch");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const cookieParser = require("cookie-parser");
const { db } = require("../../firebase"); // keep your firebase export
const router = express.Router();
router.use(cookieParser());

// env
const {
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI,
  FRONTEND_URL,
  JWT_SECRET,
  ENCRYPT_KEY,
  NODE_ENV,
} = process.env;

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI || !FRONTEND_URL || !JWT_SECRET) {
  throw new Error("Missing required env vars (CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, FRONTEND_URL, JWT_SECRET)");
}

// key derivation for AES-GCM (same as yours)
function deriveKey() {
  const raw = ENCRYPT_KEY && ENCRYPT_KEY.length >= 32 ? ENCRYPT_KEY : JWT_SECRET;
  return crypto.createHash("sha256").update(String(raw)).digest();
}
const AES_KEY = deriveKey();

function encryptObject(obj) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", AES_KEY, iv);
  const plaintext = Buffer.from(JSON.stringify(obj), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv: iv.toString("base64"), ct: encrypted.toString("base64"), tag: tag.toString("base64") };
}

function decryptObject(enc) {
  if (!enc || !enc.iv || !enc.ct || !enc.tag) return null;
  try {
    const iv = Buffer.from(enc.iv, "base64");
    const ct = Buffer.from(enc.ct, "base64");
    const tag = Buffer.from(enc.tag, "base64");
    const decipher = crypto.createDecipheriv("aes-256-gcm", AES_KEY, iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(ct), decipher.final()]);
    return JSON.parse(plain.toString("utf8"));
  } catch (e) {
    console.error("[oauth] decrypt failed", e);
    return null;
  }
}

function createSessionToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

async function exchangeCodeForToken(code) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
  });
  const res = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const text = await res.text();
  if (!res.ok) throw new Error("Token exchange failed: " + text);
  return JSON.parse(text);
}

async function refreshTokens(refreshToken) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const res = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const text = await res.text();
  if (!res.ok) throw new Error("Token refresh failed: " + text);
  return JSON.parse(text);
}

async function fetchDiscordProfile(accessToken) {
  const res = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error("Profile fetch failed: " + text);
  return JSON.parse(text);
}

// ---- LOGIN: redirect user to discord authorize URL
router.get("/login", (req, res) => {
  // debug (no secrets)
  console.log("[oauth/login] CLIENT_ID:", CLIENT_ID);
  console.log("[oauth/login] REDIRECT_URI:", REDIRECT_URI);
  console.log("[oauth/login] FRONTEND_URL:", FRONTEND_URL);

  const state = crypto.randomBytes(16).toString("hex");
  res.cookie("oauth_state", state, {
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: NODE_ENV === "production" ? "none" : "lax",
    maxAge: 5 * 60 * 1000,
  });

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "identify guilds",
    state,
    prompt: "consent",
  });

  const url = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  console.log("[oauth/login] redirecting to:", url);
  return res.redirect(url);
});

// ---- CALLBACK
router.get("/callback", async (req, res) => {
  const { code, state } = req.query;
  const savedState = req.cookies?.oauth_state;

  if (!code || !state || !savedState || state !== savedState) {
    console.warn("[oauth/callback] bad state. got:", { codeExists: !!code, state, savedState });
    return res.status(400).send("Invalid OAuth state (CSRF).");
  }
  res.clearCookie("oauth_state");

  try {
    const tokenData = await exchangeCodeForToken(code);
    const profile = await fetchDiscordProfile(tokenData.access_token);

    const encTokens = encryptObject({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      scope: tokenData.scope,
      token_type: tokenData.token_type,
    });

    const userDocRef = db.collection("users").doc(profile.id);
    await userDocRef.set(
      {
        enc_tokens: encTokens,
        expires_at: Date.now() + (tokenData.expires_in || 0) * 1000,
        user: {
          id: profile.id,
          username: profile.username,
          discriminator: profile.discriminator,
          avatar: profile.avatar,
          global_name: profile.global_name || null,
        },
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    const sessionToken = createSessionToken(profile.id);
    res.cookie("session", sessionToken, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.redirect(`${FRONTEND_URL.replace(/\/$/, "")}/dashboard`);
  } catch (err) {
    console.error("[oauth callback] failed:", err && err.message ? err.message : err);
    // include an error query param to help frontend show error
    return res.redirect(`${FRONTEND_URL.replace(/\/$/, "")}/?oauth_error=1`);
  }
});

// ---- session, refresh, logout (keep unchanged)
router.get("/session", async (req, res) => {
  // ... keep your existing session code (no changes required) ...
  // For brevity, include the same logic you already had for /session
  // Copy-paste your existing session handler here.
  res.status(501).send("Not implemented in sample - keep your existing session handler.");
});

module.exports = router;
