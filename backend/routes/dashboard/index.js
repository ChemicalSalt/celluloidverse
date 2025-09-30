// routes/dashboard/index.js
const express = require("express");
const oauthRoutes = require("./oauth");
const serversRoutes = require("./servers");
const pluginsRoutes = require("./plugins");
const guildRoutes = require("./guild");
const statusRoutes = require("./status");

const router = express.Router();

// Mount all subroutes
router.use("/oauth", oauthRoutes);
router.use("/servers", serversRoutes);
router.use("/plugins", pluginsRoutes);
router.use("/guild", guildRoutes);
router.use("/status", statusRoutes);

module.exports = router;
