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

// --- Google Sheets Setup ---
const sheetsAuth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "serviceAccountKey.json"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
});
const sheets = google.sheets({ version: "v4", auth: sheetsAuth });
const SPREADSHEET_ID = "1nRaiJ3m0z7o9Wq_zNeUm07v5f_JbbX8oTUkNz085pzg";
const RANGE = "Sheet1!A:H"; // All relevant columns

async function getRandomWord() {
  const clientSheets = await sheetsAuth.getClient();
  const res = await sheets.spreadsheets.values.get({
    auth: clientSheets,
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE
  });
  const rows = res.data.values || [];
  if (rows.length === 0) return null;

  const dataRows = rows.filter(row => row[0] && row[1]);
  const row = dataRows[Math.floor(Math.random() * dataRows.length)];

  return {
    kanji: row[0] || "",
    hiragana: row[1] || "",
    romaji: row[2] || "",
    meaning: row[3] || "",
    sentenceJP: row[4] || "",
    sentenceHiragana: row[5] || "",
    sentenceRomaji: row[6] || "",
    sentenceMeaning: row[7] || "",
  };
}

// --- Bot Ready ---
client.once("ready", async () => {
  console.log(`Bot logged in as ${client.user.tag}`);

  for (const guild of client.guilds.cache.values()) {
    await guild.members.fetch();
  }

  // --- Update bot status in Firestore ---
  setInterval(async () => {
    try {
      const totalUsers = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
      await db.collection("botStatus").doc("main").set({
        online: true,
        ping: client.ws.ping,
        servers: client.guilds.cache.size,
        users: totalUsers,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  }, 5000);

  // --- Schedule Word-of-the-Day per guild ---
  const snapshot = await db.collection("guilds").get();
  snapshot.docs.forEach(doc => {
    const guildId = doc.id;
    const lang = doc.data()?.plugins?.language;
    if (!lang || !lang.channelId || !lang.time || !lang.enabled) return;

    const [hour, minute] = lang.time.split(":");

    cron.schedule(`${minute} ${hour} * * *`, async () => {
      try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return;

        const channel = guild.channels.cache.get(lang.channelId);
        if (!channel) return;

        const word = await getRandomWord();
        if (!word) return;

        const message = `📖 **Japanese Word of the Day**  
**Kanji:** ${word.kanji}  
**Hiragana/Katakana:** ${word.hiragana}  
**Romaji:** ${word.romaji}  
**Meaning:** ${word.meaning}  

📌 **Example Sentence**  
**JP:** ${word.sentenceJP}  
**Hiragana/Katakana:** ${word.sentenceHiragana}  
**Romaji:** ${word.sentenceRomaji}  
**English:** ${word.sentenceMeaning}`;

        await channel.send(message);
      } catch (err) {
        console.error(`Error sending word for guild ${guildId}:`, err);
      }
    });
  });
});

// --- Welcome & Farewell ---
client.on("guildMemberAdd", async (member) => {
  const doc = await db.collection("guilds").doc(member.guild.id).get();
  const welcome = doc.data()?.plugins?.welcome;
  if (welcome?.enabled && welcome?.channelId) {
    const channel = member.guild.channels.cache.get(welcome.channelId);
    if (channel) channel.send(`Welcome ${member.user.username} to ${member.guild.name}!`);
  }
});

client.on("guildMemberRemove", async (member) => {
  const doc = await db.collection("guilds").doc(member.guild.id).get();
  const farewell = doc.data()?.plugins?.farewell;
  if (farewell?.enabled && farewell?.channelId) {
    const channel = member.guild.channels.cache.get(farewell.channelId);
    if (channel) channel.send(`${member.user.username} has left the server.`);
  }
});

// --- Slash Commands ---
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

// --- Express Server ---
app.get("/", (_req, res) => res.send("Bot is alive"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`Web server listening on port ${PORT}`));
