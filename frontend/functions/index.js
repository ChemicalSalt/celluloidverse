// functions/index.js
const functions = require("firebase-functions");
const fetch = require("node-fetch");

// Get secrets from Firebase environment
const CLIENT_ID = functions.config().discord.client_id;
const CLIENT_SECRET = functions.config().discord.client_secret;
const REDIRECT_URI = functions.config().discord.redirect_uri;

// Endpoint to exchange Discord code for access token
exports.discordToken = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const { code } = req.body;
  if (!code) return res.status(400).send("Missing code");

  const params = new URLSearchParams();
  params.append("client_id", CLIENT_ID);
  params.append("client_secret", CLIENT_SECRET);
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", REDIRECT_URI);

  try {
    const response = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      body: params,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const data = await response.json();
    return res.json(data); // access_token, refresh_token, expires_in, etc.
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
