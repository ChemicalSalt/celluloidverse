// functions/index.js
const functions = require("firebase-functions");
const fetch = require("node-fetch");

const CLIENT_ID = functions.config().discord.client_id;
const CLIENT_SECRET = functions.config().discord.client_secret;
const REDIRECT_URI = functions.config().discord.redirect_uri;

exports.discordToken = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const { code } = req.body;
  if (typeof code !== "string" || !code.trim()) {
    return res.status(400).json({ error: "Invalid code" });
  }

  const params = new URLSearchParams();
  params.append("client_id", CLIENT_ID);
  params.append("client_secret", CLIENT_SECRET);
  params.append("grant_type", "authorization_code");
  params.append("code", code.trim());
  params.append("redirect_uri", REDIRECT_URI);

  try {
    const response = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      body: params,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const data = await response.json();

    if (data.error) {
      functions.logger.error("Discord token exchange failed", data);
      return res.status(400).json({ error: "OAuth failed" });
    }

    // Return only safe fields
    return res.json({
      access_token: data.access_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
    });
  } catch (err) {
    functions.logger.error("OAuth error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
