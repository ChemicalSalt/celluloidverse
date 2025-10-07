require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const dashboardRoute = require("./routes/dashboard");
const statusRoute = require("./routes/dashboard/status");

const app = express();
app.set("trust proxy", 1);

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
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "OPTIONS"],
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

// Routes
app.use("/api/status", statusRoute);
app.use("/api/dashboard", dashboardRoute);

// Root
app.get("/", (_req, res) => res.send("✅ Backend running"));
app.get("/api", (_req, res) => res.json({ success: true }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
