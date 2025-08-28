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
      await docRef.set({
        plugins: {
          welcome: { enabled: true, channelId: guild.systemChannelId, message: "Welcome {user} to {server}!" },
          farewell: { enabled: true, channelId: guild.systemChannelId, message: "Goodbye {user} from {server}!" }
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
client.on("guildMemberAdd", async member => {
  try {
    const doc = await db.collection("guilds").doc(member.guild.id).get();
    const welcome = doc.data()?.plugins?.welcome;
    if (!welcome?.enabled) return;
    const channel = member.guild.channels.cache.get(welcome.channelId);
    if (!channel) return;
    const msg = welcome.message.replace("{user}", `<@${member.id}>`).replace("{server}", member.guild.name);
    channel.send(msg);
  } catch (err) { console.error(err); }
});

client.on("guildMemberRemove", async member => {
  try {
    if (member.partial) await member.fetch();
    const doc = await db.collection("guilds").doc(member.guild.id).get();
    const farewell = doc.data()?.plugins?.farewell;
    if (!farewell?.enabled) return;
    const channel = member.guild.channels.cache.get(farewell.channelId);
    if (!channel) return;
    const msg = farewell.message.replace("{user}", `<@${member.id}>`).replace("{server}", member.guild.name);
    channel.send(msg);
  } catch (err) { console.error(err); }
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
