// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const statusRoute = require("./routes/dashboard/status");
const dashboardRoute = require("./routes/dashboard");

const app = express();
app.set("trust proxy", 1); // needed for secure cookies behind proxies

if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET not set");
  process.exit(1);
}

// --- Middleware ---
app.use(express.json());
app.use(cookieParser());

// --- CORS ---
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// --- Rate Limiters ---
const dashboardLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/dashboard", dashboardLimiter);

const oauthLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts, please wait." },
});
// ✅ Corrected paths for OAuth routes
app.use("/api/dashboard/auth/login", oauthLimiter);
app.use("/api/dashboard/auth/callback", oauthLimiter);

// --- Routes ---
app.use("/api/status", statusRoute);
app.use("/api/dashboard", dashboardRoute);

// --- Root endpoints ---
app.get("/", (_req, res) => res.send("✅ Backend is running"));
app.get("/api", (_req, res) => res.json({ success: true, message: "API is working" }));

// --- Start ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
