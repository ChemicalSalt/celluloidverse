require("dotenv").config();
const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  REST, 
  Routes, 
  SlashCommandBuilder 
} = require("discord.js");
const admin = require("firebase-admin");
const express = require("express");
const app = express();
app.use(express.json());

// --- Helper: Placeholder Parser ---
function parsePlaceholders(template, member) {
  if (!template) return "";
  const guild = member.guild;

  return template
    .replace(/{usermention}/g, `<@${member.id}>`)
    .replace(/{username}/g, member.user.username)
    .replace(/{server}/g, guild.name)
    .replace(/{role:(.*?)}/g, (_, roleName) => {
      const role = guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
      return role ? `<@&${role.id}>` : roleName;
    })
    .replace(/{channel:(.*?)}/g, (_, channelName) => {
      const channel = guild.channels.cache.find(c => c.name.toLowerCase() === channelName.toLowerCase());
      return channel ? `<#${channel.id}>` : channelName;
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
  partials: [Partials.GuildMember]   // ✅ needed for farewell on kick/leave
});

// --- Initialize Firebase ---
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
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

  for (const guild of client.guilds.cache.values()) {
    await guild.members.fetch(); // ensures memberRemove is reliable
  }

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

// --- Welcome ---
client.on("guildMemberAdd", async member => {
  try {
    console.log(`Member joined: ${member.user.tag}`);
    const doc = await db.collection("guilds").doc(member.guild.id).get();
    const data = doc.data();
    if (!data) return;

    const welcome = data.plugins?.welcome;
    if (!welcome) return;

    if (welcome.enabled && welcome.serverMessage && welcome.channelId) {
      const channel = member.guild.channels.cache.get(welcome.channelId);
      if (channel) {
        const msg = parsePlaceholders(welcome.serverMessage, member);
        channel.send(msg);
      }
    }

    if (welcome.dmEnabled && welcome.dmMessage) {
      const msg = parsePlaceholders(welcome.dmMessage, member);
      member.send(msg).catch(() => {});
    }
  } catch (err) {
    console.error("Welcome error:", err);
  }
});

// --- Farewell ---
client.on("guildMemberRemove", async member => {
  try {
    if (member.partial) await member.fetch();
    console.log(`Member left: ${member.user?.tag || member.id}`);

    const doc = await db.collection("guilds").doc(member.guild.id).get();
    const data = doc.data();
    if (!data) return;

    const farewell = data.plugins?.farewell;
    if (!farewell) return;

    if (farewell.enabled && farewell.serverMessage && farewell.channelId) {
      const channel = member.guild.channels.cache.get(farewell.channelId);
      if (channel) {
        const msg = parsePlaceholders(farewell.serverMessage, member);
        channel.send(msg);
      }
    }

    if (farewell.dmEnabled && farewell.dmMessage) {
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
