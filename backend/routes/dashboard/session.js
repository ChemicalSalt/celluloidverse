const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");

const JWT_SECRET = process.env.JWT_SECRET;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

// ------------------------------
// Verify JWT session (middleware)
// ------------------------------
function verifySession(req, res, next) {
  try {
    const auth = req.headers.authorization;
    const cookieToken = req.cookies?.session;
    const token = auth ? auth.split(" ")[1] : cookieToken;

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Verify and attach payload (usually { userId })
    const decoded = jwt.verify(token, JWT_SECRET);
    req.session = decoded;
    return next();
  } catch (err) {
    console.error("Session verification failed:", err.message);
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}

// ------------------------------
// Refresh Discord access token
// ------------------------------
async function refreshDiscordToken(refreshToken) {
  try {
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

    // Return normalized structure
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    };
  } catch (err) {
    console.error("Error refreshing Discord token:", err);
    throw err;
  }
}

module.exports = { verifySession, refreshDiscordToken };
