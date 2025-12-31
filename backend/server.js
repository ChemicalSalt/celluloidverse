require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

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

// ✅ NEW: Health Check Endpoint (no rate limiting)
app.get("/api/health", (_req, res) => {
  res.json({ 
    status: "ok", 
    service: "CelluloidVerse Backend",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "production",
    discordConfigured: !!(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET)
  });
});

// Routes
app.use("/api/status", statusRoute);
app.use("/api/dashboard", dashboardRoute);

// Root
app.get("/", (_req, res) => res.send("✅ Backend running"));
app.get("/api", (_req, res) => res.json({ success: true }));

// Cookie testing endpoints
app.get("/api/test-cookie", (req, res) => {
  res.cookie("test_cookie", "hello_render", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  res.json({ message: "Cookie sent!" });
});

app.get("/api/check-cookie", (req, res) => {
  console.log("Cookies received:", req.cookies);
  res.json({ cookies: req.cookies || "No cookies" });
});

// ✅ NEW: Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({ 
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

// ✅ NEW: 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: "Not found",
    path: req.path 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));