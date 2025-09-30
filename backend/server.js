require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const statusRoute = require("./routes/dashboard/status"); 
const dashboardRoute = require("./routes/dashboard");

const app = express();

// Ensure a JWT secret exists
if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET not set");
  process.exit(1);
}

// Middleware
app.use(express.json());
app.use(cookieParser());

// configure CORS for your frontend
app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Rate limiters
const dashboardLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, 
  message: { error: "Too many requests, please try again later." }
});
app.use("/api/dashboard", dashboardLimiter);

const oauthLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10, // stricter for login/callback
  message: { error: "Too many login attempts, please wait." }
});
app.use("/api/dashboard/login", oauthLimiter);
app.use("/api/dashboard/callback", oauthLimiter);

// Routes
app.use("/api/status", statusRoute);
app.use("/api/dashboard", dashboardRoute);

// Root routes
app.get("/", (_req, res) => res.send("Backend is running!"));
app.get("/api", (_req, res) => res.json({ success: true, message: "API is working" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
