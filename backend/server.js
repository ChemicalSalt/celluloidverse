// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const statusRoute = require("./routes/status"); // keep if you have it
const dashboardRoute = require("./routes/dashboard"); // updated route (below)

const app = express();

// configure CORS for your frontend
app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Routes
app.use("/api/status", statusRoute);
app.use("/api/dashboard", dashboardRoute);

// Root routes
app.get("/", (_req, res) => res.send("Backend is running!"));
app.get("/api", (_req, res) => res.json({ success: true, message: "API is working" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
