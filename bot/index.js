require("dotenv").config();
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const admin = require("firebase-admin");
const express = require("express");
const { google } = require("googleapis");

// --- Express ---
const app = express();
app.use(express.json());

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
client.db = null; // will assign Firestore later

// --- Firebase ---
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
client.db = admin.firestore();

// --- Google Sheets ---
const sheetsAuth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT),
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
client.sheetsAuth = sheetsAuth;
client.sheets = google.sheets({ version: "v4", auth: sheetsAuth });
client.SPREADSHEET_ID = process.env.SPREADSHEET_ID;
client.RANGE = "Sheet1!A:H";

// --- Load client modules ---
require("./client/client")(client);

// --- Web server ---
app.get("/", (_req, res) => res.send("Bot is alive"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`🌐 Web server on ${PORT}`));

client.login(process.env.TOKEN);
