// backend/routes/dashboard/oauth.js
const express = require("express");
const fetch = require("node-fetch");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const cookieParser = require("cookie-parser");
const { db } = require("../../firebase"); // your firebase.js exporting { db }

const router = express.Router();
router.use(cookieParser());

// --- Required env vars (must exist) ---
const {
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI,
  FRONTEND_URL,
  JWT_SECRET,
  ENCRYPT_KEY, // optional but recommended
  NODE_ENV,
} = process.env;

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI || !FRONTEND_URL || !JWT_SECRET) {
  throw new Error("Missing required env vars (CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, FRONTEND_URL, JWT_SECRET)");
}

// --- AES-GCM helper: derive 32-byte key from ENCRYPT_KEY or fallback to JWT_SECRET ---
function deriveKey() {
  const raw = (ENCRYPT_KEY && ENCRYPT_KEY.length >= 32) ? ENCRYPT_KEY : JWT_SECRET;
  // use SHA-256 to derive a 32-byte key
  return crypto.createHash("sha256").update(String(raw)).digest();
}
const AES_KEY = deriveKey(); // Buffer(32)

// --- Encryption helpers (AES-256-GCM) ---
function encryptObject(obj) {
  const iv = crypto.randomBytes(12); // 96-bit recommended for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", AES_KEY, iv);
  const plaintext = Buffer.from(JSON.stringify(obj), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString("base64"),
    ct: encrypted.toString("base64"),
    tag: tag.toString("base64"),
  };
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

// --- Helper: create JWT session cookie (7 days) ---
function createSessionToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

// --- Helper: Discord token exchange ---
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
  if (!res.ok) {
    const txt = await res.text();
    throw new Error("Token exchange failed: " + txt);
  }
  return res.json();
}

// --- Helper: refresh tokens using refresh_token ---
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
  if (!res.ok) {
    const txt = await res.text();
    throw new Error("Token refresh failed: " + txt);
  }
  return res.json();
}

// --- Helper: fetch Discord profile with access token ---
async function fetchDiscordProfile(accessToken) {
  const res = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error("Profile fetch failed: " + txt);
  }
  return res.json();
}

// --- Route: /auth/url -> redirect user to Discord authorize page (adds state cookie) ---
router.get("/url", (req, res) => {
  const state = crypto.randomBytes(16).toString("hex");
  res.cookie("oauth_state", state, {
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: "none",
    maxAge: 5 * 60 * 1000, // 5 minutes
  });

  const scope = encodeURIComponent("identify guilds");
  const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${scope}&state=${state}&prompt=consent`;
  return res.redirect(url);
});

// --- Route: /auth/callback -> handle code exchange, save encrypted tokens, set session cookie, redirect to frontend ---
router.get("/callback", async (req, res) => {
  const { code, state } = req.query;
  const savedState = req.cookies?.oauth_state;
  if (!code || !state || !savedState || state !== savedState) {
    return res.status(400).send("Invalid OAuth state (CSRF).");
  }
  // clear the state cookie
  res.clearCookie("oauth_state");

  try {
    const tokenData = await exchangeCodeForToken(code);
    // tokenData: access_token, refresh_token, expires_in, scope, token_type

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
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.redirect(`${FRONTEND_URL}/dashboard`);
  } catch (err) {
    console.error("[oauth callback] failed:", err);
    return res.status(500).send("OAuth callback failed");
  }
});

// --- Route: /auth/session -> check cookie, return profile; auto-refresh tokens if expired ---
router.get("/session", async (req, res) => {
  try {
    const token = req.cookies?.session;
    if (!token) return res.status(401).json({ error: "No session" });

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const userId = decoded.userId;
    const doc = await db.collection("users").doc(userId).get();
    if (!doc.exists) return res.status(401).json({ error: "User not found" });

    const data = doc.data();
    // Check expiration and refresh if needed
    if (!data.expires_at || data.expires_at <= Date.now()) {
      // attempt refresh
      const enc = data.enc_tokens;
      const stored = decryptObject(enc);
      if (!stored || !stored.refresh_token) {
        // cannot refresh -> require re-auth
        return res.status(401).json({ error: "Token expired, re-auth required" });
      }
      try {
        const refreshed = await refreshTokens(stored.refresh_token);
        // update tokens in DB
        const newEnc = encryptObject({
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token,
          scope: refreshed.scope,
          token_type: refreshed.token_type,
        });
        await db.collection("users").doc(userId).set(
          {
            enc_tokens: newEnc,
            expires_at: Date.now() + (refreshed.expires_in || 0) * 1000,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        // refresh local data object
        data.enc_tokens = newEnc;
        data.expires_at = Date.now() + (refreshed.expires_in || 0) * 1000;
      } catch (err) {
        console.warn("[oauth] refresh failed:", err);
        return res.status(401).json({ error: "Token refresh failed, re-auth required" });
      }
    }

    // Respond with minimal profile only
    const safeProfile = data.user || { id: userId };
    return res.json({ user: safeProfile });
  } catch (err) {
    console.error("[oauth session] error:", err);
    return res.status(500).json({ error: "Session check failed" });
  }
});

// --- Route: /auth/refresh/:userId -> manual refresh (optional) ---
router.get("/refresh/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const doc = await db.collection("users").doc(userId).get();
    if (!doc.exists) return res.status(404).json({ error: "User not found" });

    const data = doc.data();
    const stored = decryptObject(data.enc_tokens);
    if (!stored || !stored.refresh_token) return res.status(400).json({ error: "No refresh token" });

    try {
      const refreshed = await refreshTokens(stored.refresh_token);
      const newEnc = encryptObject({
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token,
        scope: refreshed.scope,
        token_type: refreshed.token_type,
      });
      await db.collection("users").doc(userId).set(
        {
          enc_tokens: newEnc,
          expires_at: Date.now() + (refreshed.expires_in || 0) * 1000,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      return res.json({ ok: true });
    } catch (err) {
      console.error("[oauth refresh] failed:", err);
      return res.status(500).json({ error: "Refresh failed" });
    }
  } catch (err) {
    console.error("[oauth refresh] error:", err);
    return res.status(500).json({ error: "Refresh error" });
  }
});

// --- Route: /auth/logout -> clear cookie (and optionally delete tokens) ---
router.post("/logout", async (req, res) => {
  try {
    const token = req.cookies?.session;
    if (token) {
      try { 
        const decoded = jwt.verify(token, JWT_SECRET);
        // optionally: remove tokens server-side (if you want)
        // await db.collection("users").doc(decoded.userId).update({ enc_tokens: admin.firestore.FieldValue.delete() });
      } catch {}
    }

    res.clearCookie("session");
    return res.json({ ok: true });
  } catch (err) {
    console.error("[oauth logout] error:", err);
    return res.status(500).json({ error: "Logout failed" });
  }
});

module.exports = router;
