const { Client, GatewayIntentBits } = require("discord.js");
const admin = require("firebase-admin");
require("dotenv").config(); // make sure BOT_TOKEN is in .env

// --- Initialize Discord Client ---
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// --- Initialize Firebase ---
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();
const statusRef = db.collection("botStatus").doc("main");

// --- Bot Ready ---
client.once("ready", () => {
  console.log(`Bot logged in as ${client.user.tag}`);

  // Update Firestore every 5 seconds
  setInterval(async () => {
    try {
      await statusRef.set({
        online: true,
        ping: client.ws.ping,
        servers: client.guilds.cache.size,
        timestamp: new Date().toISOString()
      });
      console.log("Status updated");
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  }, 5000);
});

// --- Login Bot ---
client.login(process.env.TOKEN);
