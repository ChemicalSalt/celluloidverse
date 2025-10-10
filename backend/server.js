require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");

const dashboardRoute = require("./routes/dashboard");
const statusRoute = require("./routes/dashboard/status");

const app = express();
app.set("trust proxy", 1);

console.log("🚀 Loaded server.js on Render");

// Safety check
if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET not set");
  process.exit(1);
}

app.use(express.json());
app.use(cookieParser());

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// Rate limiters
app.use(
  "/api/dashboard",
  rateLimit({ windowMs: 60 * 1000, max: 30, message: { error: "Too many requests" } })
);
app.use(
  ["/api/dashboard/auth/login", "/api/dashboard/auth/callback"],
  rateLimit({ windowMs: 60 * 1000, max: 10, message: { error: "Too many login attempts" } })
);

// ✅ Create token and send cookie after login (temporary mock)
app.get("/api/login-success", (req, res) => {
  const token = jwt.sign({ user: "test_user" }, process.env.JWT_SECRET, { expiresIn: "7d" });

  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.json({ message: "Logged in successfully!" });
});

// ✅ Auto-login check route
app.get("/api/check-auth", (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ loggedIn: false });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ loggedIn: true, user: decoded });
  } catch {
    res.status(401).json({ loggedIn: false });
  }
});

// Routes
app.use("/api/status", statusRoute);
app.use("/api/dashboard", dashboardRoute);

// Root
app.get("/", (_req, res) => res.send("✅ Backend running"));
app.get("/api", (_req, res) => res.json({ success: true }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
