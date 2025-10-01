require("dotenv").config();
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const admin = require("firebase-admin");
const express = require("express");

// --- Firebase ---
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

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
client.db = db;

// --- Express ---
const app = express();
app.use(express.json());
require("./web/server")(app);
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`🌐 Web server on ${PORT}`));

// --- Load client, events, commands, cron ---
require("./client/client")(client);
require("./cron/scheduler")(client);

client.login(process.env.TOKEN);
