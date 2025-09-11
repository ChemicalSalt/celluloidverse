const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require("discord.js");
const admin = require("firebase-admin");
const express = require("express");
require("dotenv").config();
const app = express();
app.use(express.json());

// --- Helper: Placeholder Parser ---
function parsePlaceholders(template, member) {
  if (!template) return "";

  const guild = member.guild;

  return template
    .replace(/{user}/g, `<@${member.id}>`) // mention
    .replace(/{username}/g, member.user.username) // plain name
    .replace(/{server}/g, guild.name) // guild name
    .replace(/{role:(.*?)}/g, (_, roleName) => {
      const role = guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
      return role ? `<@&${role.id}>` : `{role:${roleName}}`;
    })
    .replace(/{channel:(.*?)}/g, (_, channelName) => {
      const channel = guild.channels.cache.find(c => c.name.toLowerCase() === channelName.toLowerCase());
      return channel ? `<#${channel.id}>` : `{channel:${channelName}}`;
    });
}

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

// --- NEW: Default channel fallback ---
let defaultChannelId = null;

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

  // --- NEW: Set default channel ---
  for (const guild of client.guilds.cache.values()) {
    if (guild.systemChannelId) {
      defaultChannelId = guild.systemChannelId;
      break;
    }
  }
  console.log("Default channel set to:", defaultChannelId);

  // Fetch all members for leave event reliability
  for (const guild of client.guilds.cache.values()) {
    await guild.members.fetch();

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
client.on("guildMemberAdd", async member => {
  try {
    const doc = await db.collection("guilds").doc(member.guild.id).get();
    const data = doc.data();
    if (!data) return;

    const welcome = data.plugins?.welcome;
    if (!welcome?.enabled) return;

    if (welcome.serverMessage && welcome.channelId) {
      const channel = member.guild.channels.cache.get(welcome.channelId);
      if (channel) {
        const msg = parsePlaceholders(welcome.serverMessage, member);
        channel.send(msg);
      }
    }

    if (welcome.dmMessage) {
      const msg = parsePlaceholders(welcome.dmMessage, member);
      member.send(msg).catch(() => {});
    }
  } catch (err) {
    console.error("Welcome error:", err);
  }
});

client.on("guildMemberRemove", async member => {
  try {
    if (member.partial) await member.fetch();
    const doc = await db.collection("guilds").doc(member.guild.id).get();
    const data = doc.data();
    if (!data) return;

    const farewell = data.plugins?.farewell;
    if (!farewell?.enabled) return;

    if (farewell.serverMessage && farewell.channelId) {
      const channel = member.guild.channels.cache.get(farewell.channelId);
      if (channel) {
        const msg = parsePlaceholders(farewell.serverMessage, member);
        channel.send(msg);
      }
    }

    if (farewell.dmMessage) {
      const msg = parsePlaceholders(farewell.dmMessage, member);
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
app.get("/", (_req, res) => res.send("Bot is alive"));
const PORT = process.env.PORT || 3000;

// Save guild settings
app.post("/api/guilds/:guildId/settings", async (req, res) => {
  try {
    const { guildId } = req.params;
    const { welcome, farewell } = req.body;

    await db.collection("guilds").doc(guildId).set({
      plugins: { welcome, farewell }
    }, { merge: true });

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to update settings:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

app.listen(PORT, "0.0.0.0", () => console.log(`Web server listening on port ${PORT}`));
