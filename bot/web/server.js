// web/server.js
const express = require("express");
const { PORT } = require("../config/botConfig");

let serverInstance = null;

function start(client) {
  const app = express();
  app.use(express.json());

  app.get("/", (_req, res) => res.send("Bot is alive"));
  app.get("/health", (_req, res) => res.json({ status: "ok", bot: client?.user?.tag || null }));

  serverInstance = app.listen(PORT || 3000, "0.0.0.0", () => {
    console.log(`🌐 Web server on ${PORT || 3000}`);
  });

  return serverInstance;
}

module.exports = { start };
