require("dotenv").config();
const express = require("express");
const { Client, GatewayIntentBits, Partials } = require("discord.js");

// --- Config & Helpers ---
const { intents, partials } = require("./config/botConfig");
const { registerEvents } = require("./client/events");
const { registerCommands } = require("./client/commands");
const { scheduleAllGuildWOTD } = require("./cron/scheduler");

// --- Discord Client ---
const client = new Client({
  intents: intents.map(i => GatewayIntentBits[i]),
  partials: partials.map(p => Partials[p])
});

// --- Express Server ---
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;
app.get("/", (_req, res) => res.send("Bot is alive"));
app.listen(PORT, "0.0.0.0", () => console.log(`🌐 Web server running on ${PORT}`));

// --- Load Events & Commands ---
registerEvents(client);
registerCommands(client);

// --- Schedule WOTD on Ready ---
client.once("ready", () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);
  scheduleAllGuildWOTD(client);
});

// --- Login ---
client.login(process.env.TOKEN);
