const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require("discord.js");
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
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const statusRef = db.collection("botStatus").doc("main");

// --- Slash command setup ---
const commands = [
  new SlashCommandBuilder().setName("ping").setDescription("Check if bot is alive"),
  new SlashCommandBuilder().setName("welcome").setDescription("Test welcome message")
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
(async () => {
  try {
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log("Slash commands registered");
  } catch (err) {
    console.error(err);
  }
})();

// --- Bot Ready ---
client.once("ready", async () => {
  console.log(`Bot logged in as ${client.user.tag}`);

  // Fetch all members for leave event reliability
  for (const guild of client.guilds.cache.values()) {
    await guild.members.fetch();
    // Auto-create default Firestore doc if missing
    const docRef = db.collection("guilds").doc(guild.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      // When creating default Firestore doc
await docRef.set({
  plugins: {
    welcome: { 
      enabled: true, 
      channelId: guild.systemChannelId, 
      serverMessage: "Welcome {user} to {server}!", 
      dmMessage: "" // empty by default, user can fill via dashboard
    },
    farewell: { 
      enabled: true, 
      channelId: guild.systemChannelId, 
      serverMessage: "Goodbye {user} from {server}!", 
      dmMessage: "" 
    }
  }
});

      console.log(`Created default Firestore doc for guild: ${guild.name}`);
    }
  }

  // Update bot status every 5 seconds
  setInterval(async () => {
    try {
      const totalUsers = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
      await statusRef.set({
        online: true,
        ping: client.ws.ping,
        servers: client.guilds.cache.size,
        users: totalUsers,
        timestamp: new Date().toISOString()
      });
    } catch (err) { console.error("Failed to update status:", err); }
  }, 5000);
});

// --- Welcome / Farewell ---
// --- Welcome ---
client.on("guildMemberAdd", async member => {
  try {
    const doc = await db.collection("guilds").doc(member.guild.id).get();
    const data = doc.data();
    if (!data) return;

    const welcome = data.plugins?.welcome;
    if (!welcome?.enabled) return;

    // Send server message if channel exists
    if (welcome.serverMessage && welcome.channelId) {
      const channel = member.guild.channels.cache.get(welcome.channelId);
      if (channel) {
        const msg = welcome.serverMessage
          .replace("{user}", `<@${member.id}>`)
          .replace("{server}", member.guild.name);
        channel.send(msg);
      }
    }

    // Send DM if set
    if (welcome.dmMessage) {
      const msg = welcome.dmMessage
        .replace("{user}", member.user.username)
        .replace("{server}", member.guild.name);
      member.send(msg).catch(() => {}); // ignore if DMs blocked
    }

  } catch (err) {
    console.error("Welcome error:", err);
  }
});

// --- Farewell ---
client.on("guildMemberRemove", async member => {
  try {
    if (member.partial) await member.fetch();
    const doc = await db.collection("guilds").doc(member.guild.id).get();
    const data = doc.data();
    if (!data) return;

    const farewell = data.plugins?.farewell;
    if (!farewell?.enabled) return;

    // Send server message
    if (farewell.serverMessage && farewell.channelId) {
      const channel = member.guild.channels.cache.get(farewell.channelId);
      if (channel) {
        const msg = farewell.serverMessage
          .replace("{user}", `<@${member.id}>`)
          .replace("{server}", member.guild.name);
        channel.send(msg);
      }
    }

    // Send DM
    if (farewell.dmMessage) {
      const msg = farewell.dmMessage
        .replace("{user}", member.user.username)
        .replace("{server}", member.guild.name);
      member.send(msg).catch(() => {});
    }

  } catch (err) {
    console.error("Farewell error:", err);
  }
});


// --- Slash command handling ---
client.on("interactionCreate", async interaction => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName === "ping") await interaction.reply("Pong!");
  if (interaction.commandName === "welcome") {
    await interaction.reply("This is how welcome messages will appear when a member joins!");
  }
});

// --- Login ---
client.login(process.env.TOKEN);

// --- Express Server ---
const app = express();
app.get("/", (_req, res) => res.send("Bot is alive"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`Web server listening on port ${PORT}`));
