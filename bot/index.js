// index.js
require("dotenv").config();
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const express = require("express");
const path = require("path");

// configs / utils / services
const botConfig = require("./config/botConfig");
const sheetsConfig = require("./config/sheetsConfig");
const firestoreUtil = require("./utils/firestore");
const helpers = require("./utils/helpers");

// discord client instance
const clientBuilder = require("./client/client");

// scheduler (central cron manager)
const scheduler = require("./cron/scheduler");

// web server
const webServer = require("./web/server");

// command registration (will be performed once)
const { registerCommands } = require("./client/client");

// attach client
const client = clientBuilder.buildClient();

// wire common services onto client for use in other modules
client.app = express(); // optional reference
client.db = firestoreUtil.db;
client.helpers = helpers;
client.sheets = sheetsConfig.sheetsClient;
client.SPREADSHEET_ID = process.env.SPREADSHEET_ID || "";

// load events (they export { name, once, execute })
const eventsPath = require("path").join(__dirname, "client", "events");
const fs = require("fs");
for (const file of fs.readdirSync(eventsPath)) {
  if (!file.endsWith(".js")) continue;
  const ev = require(path.join(eventsPath, file));
  if (ev.once) client.once(ev.name, (...args) => ev.execute(client, ...args));
  else client.on(ev.name, (...args) => ev.execute(client, ...args));
}

// load plugins so they register any internal functions (they export but also may register)
const plugins = ["./plugins/wotd", "./plugins/welcome", "./plugins/farewell"];
plugins.forEach((p) => {
  try {
    require(p)(client, {
      db: firestoreUtil.db,
      sheets: sheetsConfig.sheetsClient,
      helpers,
      scheduler,
    });
  } catch (e) {
    console.error(`Error loading plugin ${p}:`, e);
  }
});

// register slash commands (loads commands from client/commands)
(async () => {
  try {
    await registerCommands();
    console.log("✅ Commands registered (or updated).");
  } catch (err) {
    console.error("🔥 Command registration failed:", err);
  }
})();

// start web server (health)
webServer.start(client);

// login bot
client.login(process.env.TOKEN).catch((e) => {
  console.error("🔥 Discord login failed:", e);
  process.exit(1);
});
