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
const cron = require("node-cron");
const { google } = require("googleapis");
const path = require("path");

const app = express();
app.use(express.json());

// --- Initialize Discord Client ---
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.GuildMember]
});

// --- Initialize Firebase ---
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();
const statusRef = db.collection("botStatus").doc("main");

// --- Google Sheets Setup ---
const sheetsAuth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "serviceAccountKey.json"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
});
const sheets = google.sheets({ version: "v4", auth: sheetsAuth });
const SPREADSHEET_ID = "1nRaiJ3m0z7o9Wq_zNeUm07v5f_JbbX8oTUkNz085pzg";
const RANGE = "Sheet1!A:A"; // Column with words

async function getRandomWord() {
  const clientSheets = await sheetsAuth.getClient();
  const res = await sheets.spreadsheets.values.get({
    auth: clientSheets,
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE
  });
  const words = res.data.values?.flat() || [];
  if (words.length === 0) return "No word found";
  return words[Math.floor(Math.random() * words.length)];
}

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

// --- Bot Ready ---
client.once("ready", async () => {
  console.log(`Bot logged in as ${client.user.tag}`);

  for (const guild of client.guilds.cache.values()) {
    await guild.members.fetch();
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

  // --- Language Plugin: Schedule per-server cron (24h format) ---
  const snapshot = await db.collection("guilds").get();
  snapshot.docs.forEach(doc => {
    const guildId = doc.id;
    const lang = doc.data()?.plugins?.language;

    if (!lang || !lang.channelId || !lang.time) return;

    // Clear any previous cron jobs for safety
    cron.getTasks().forEach(task => task.stop());

    const [hour, minute] = lang.time.split(":");
    cron.schedule(`${minute} ${hour} * * *`, async () => {
      try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return;

        const channel = guild.channels.cache.get(lang.channelId);
        if (!channel) return;

        const word = await getRandomWord();
        await channel.send(`📖 Word of the Day: **${word}**`);
        console.log(`Sent word "${word}" to guild ${guildId}`);
      } catch (err) {
        console.error(`Error sending word for guild ${guildId}:`, err);
      }
    });

    console.log(`Scheduled daily word for guild ${guildId} at ${lang.time} in channel ${lang.channelId}`);
  });
});

// --- Slash commands ---
const commands = [
  new SlashCommandBuilder().setName("ping").setDescription("Check if bot is alive"),
  new SlashCommandBuilder().setName("welcome").setDescription("Test welcome message")
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
(async () => {
  try { await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands }); }
  catch (err) { console.error(err); }
})();

client.on("interactionCreate", async interaction => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName === "ping") await interaction.reply("Pong!");
  if (interaction.commandName === "welcome") await interaction.reply("This is how welcome messages will appear!");
});

// --- Login ---
client.login(process.env.TOKEN);

// --- Express server ---
app.get("/", (_req, res) => res.send("Bot is alive"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`Web server listening on port ${PORT}`));
