require("dotenv").config();
const express = require("express");
const cors = require("cors");

const statusRoute = require("./routes/status");
const dashboardRoute = require("./routes/dashboard");

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Routes
app.use("/api/status", statusRoute);
app.use("/api/dashboard", dashboardRoute);

// Root route
app.get("/", (_req, res) => res.send("Backend is running!"));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
