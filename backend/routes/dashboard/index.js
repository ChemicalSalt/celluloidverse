const express = require("express");
const oauthRoutes = require("./oauth");
const serversRoutes = require("./servers");
const pluginsRoutes = require("./plugins");
const guildRoutes = require("./guild");
const statusRoutes = require("./status");
const schedulerRoutes = require("./scheduler");
const router = express.Router();

// Mount routes
router.use("/auth", oauthRoutes);
router.use("/servers", serversRoutes);       // servers routes
router.use("/", pluginsRoutes);    
router.use("/servers", schedulerRoutes);
router.use("/guild", guildRoutes);
router.use("/status", statusRoutes);

module.exports = router;
