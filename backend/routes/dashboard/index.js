const express = require("express");
const oauthRoutes = require("./oauth");
const serversRoutes = require("./servers");
const pluginsRoutes = require("./plugins");
const guildRoutes = require("./guild");
const statusRoutes = require("./status");

const router = express.Router();

// Mount routes
router.use("/", oauthRoutes);
router.use("/servers", serversRoutes);       // servers routes
router.use("/servers", pluginsRoutes);       // plugins under servers
router.use("/guild", guildRoutes);
router.use("/status", statusRoutes);

module.exports = router;
