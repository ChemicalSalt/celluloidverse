const { Client, GatewayIntentBits } = require("discord.js");
const admin = require("firebase-admin");
const express = require("express");
require("dotenv").config(); 

// --- Initialize Discord Client ---
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,   
    GatewayIntentBits.MessageContent   
  ],
  partials: ['GUILD_MEMBER']
});


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
    const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    const totalChannels = client.channels.cache.size;
    const cachedUsers = client.users.cache.size;
    
    await statusRef.set({
      online: true,
      ping: client.ws.ping,
      servers: client.guilds.cache.size,
      users: totalUsers,
      cachedUsers: cachedUsers,
      channels: totalChannels,
      timestamp: new Date().toISOString()
    });
    console.log("Status updated");
  } catch (err) {
    console.error("Failed to update status:", err);
  }
}, 5000);

});


  // --- Listen for member joins ---
client.on("guildMemberAdd", member => {
  console.log(`New member joined: ${member.user.tag} in ${member.guild.name}`);
});

// --- Listen for member leaves ---
client.on("guildMemberRemove", member => {
  console.log(`Member left: ${member.user.tag} from ${member.guild.name}`);
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return; // ignore bot messages
  if (message.content.toLowerCase() === "!ping") {
    message.channel.send("Pong!");
  }
});

// --- Login Bot ---
client.login(process.env.TOKEN);

// --- Minimal Express Server for Render ---
const app = express();
app.get("/", (_req, res) => res.send("Bot is alive"));

// Render assigns a PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Web server listening on port ${PORT}`);
});
