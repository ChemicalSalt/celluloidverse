const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");

const JWT_SECRET = process.env.JWT_SECRET;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

function verifySession(req, res, next) {
  try {
    const auth = req.headers.authorization;
    const cookieToken = req.cookies && req.cookies.session;
    const token = auth ? auth.split(" ")[1] : cookieToken;
    if (!token) return res.status(401).json({ error: "No token provided" });

    req.session = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid session" });
  }
}

async function refreshDiscordToken(refreshToken) {
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
  return tokenRes.json();
}

module.exports = { verifySession, refreshDiscordToken };
