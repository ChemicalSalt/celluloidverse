const express = require("express");
const oauthRoutes = require("./oauth");
const serversRoutes = require("./servers");
const pluginsRoutes = require("./plugins");
const guildRoutes = require("./guild");
const statusRoutes = require("./status");

const router = express.Router();

// Mount routes
router.use("/", oauthRoutes);
router.use("/", serversRoutes);       // servers routes
router.use("/plugins", pluginsRoutes);       // plugins under servers
router.use("/guild", guildRoutes);
router.use("/status", statusRoutes);

module.exports = router;
