require("dotenv").config();
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const { initializeFirebase } = require("./config/botConfig");
const { initializeSheets } = require("./config/sheetsConfig");
const { startServer } = require("./web/server");
const { loadClient } = require("./client/client");

// --- Discord Client ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.GuildMember],
});

// --- Firebase ---
const db = initializeFirebase();
client.db = db;

// --- Google Sheets ---
const { sheets, SPREADSHEET_ID, RANGE } = initializeSheets();
client.sheets = sheets;
client.SPREADSHEET_ID = SPREADSHEET_ID;
client.RANGE = RANGE;

// --- Load Client (commands + events) ---
loadClient(client);

// --- Web Server ---
startServer();

// --- Login Bot ---
client.login(process.env.TOKEN);
