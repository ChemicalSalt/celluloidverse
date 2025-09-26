// index.js (final — replace your current bot entry with this)
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
  if (!dataRows.length) return null;
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

// --- Cron job map ---
const scheduledJobs = new Map();

async function sendWOTDNow(guildId, pluginSettings) {
  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      console.warn(`❗ Bot is not in guild ${guildId}`);
      return { ok: false, reason: "bot_not_in_guild" };
    }

    // try cached channel, else fetch
    let channel = guild.channels.cache.get(pluginSettings.channelId);
    if (!channel) {
      try {
        channel = await guild.channels.fetch(pluginSettings.channelId);
      } catch (e) {
        // ignore, will be handled below
      }
    }
    if (!channel) {
      console.warn(`❗ Channel ${pluginSettings.channelId} not found in guild ${guildId}`);
      return { ok: false, reason: "channel_not_found" };
    }

    // permission check
    const meMember = guild.members.me || await guild.members.fetch(client.user.id);
    if (!channel.permissionsFor(meMember)?.has("SendMessages")) {
      console.warn(`❗ Bot lacks SendMessages permission in channel ${pluginSettings.channelId} (guild ${guildId})`);
      return { ok: false, reason: "no_send_permission" };
    }

    const word = await getRandomWord();
    if (!word) {
      console.warn(`❗ No word available in sheet`);
      return { ok: false, reason: "no_word" };
    }

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
    console.log(`✅ Sent WOTD to guild ${guildId} channel ${pluginSettings.channelId}`);
    return { ok: true };
  } catch (err) {
    console.error(`Error sending WOTD for guild ${guildId}:`, err);
    return { ok: false, reason: "exception", error: err };
  }
}

async function scheduleWordOfTheDay(guildId, pluginSettings) {
  // Stop existing job if plugin invalid/disabled
  if (!pluginSettings || !pluginSettings.enabled || !pluginSettings.channelId || !pluginSettings.time) {
    if (scheduledJobs.has(guildId)) {
      scheduledJobs.get(guildId).stop();
      scheduledJobs.delete(guildId);
      console.log(`🛑 Cancelled WOTD job for guild ${guildId}`);
    }
    return;
  }

  // parse HH:MM (frontend gives "HH:MM")
  const parts = String(pluginSettings.time).split(":");
  if (parts.length < 2) {
    console.warn(`Invalid time for guild ${guildId}: ${pluginSettings.time}`);
    return;
  }
  const hour = parts[0].padStart(2, "0");
  const minute = parts[1].padStart(2, "0");

  // Cancel previous job if exists
  if (scheduledJobs.has(guildId)) {
    scheduledJobs.get(guildId).stop();
  }

  console.log(`⏰ Scheduling WOTD for guild ${guildId} at ${pluginSettings.time} (channel ${pluginSettings.channelId})`);

  // timezone option — default to Asia/Kolkata so dashboard times match user's local time
  const timezone = process.env.CRON_TZ || "Asia/Kolkata";

  const cronExp = `${minute} ${hour} * * *`;
  const job = cron.schedule(cronExp, async () => {
    console.log(`🔔 Trigger WOTD fired for ${guildId} (scheduled ${pluginSettings.time}) at ${new Date().toISOString()}`);
    await sendWOTDNow(guildId, pluginSettings);
  }, { timezone });

  scheduledJobs.set(guildId, job);
}

// --- Bot Ready ---
client.once("ready", async () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);

  // prefetch guild members for better caching (optional)
  for (const guild of client.guilds.cache.values()) {
    try { await guild.members.fetch(); } catch (e) { /* ignore fetch errors */ }
  }

  // status updater
  setInterval(async () => {
    try {
      const totalUsers = client.guilds.cache.reduce((acc, g) => acc + (g.memberCount || 0), 0);
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

  // realtime listener on 'guilds' collection (keeps naming as you have)
  db.collection("guilds").onSnapshot(snapshot => {
    console.log(`Firestore snapshot received: ${snapshot.size} guild docs`);
    snapshot.docs.forEach(doc => {
      const guildId = doc.id;
      const plugin = doc.data()?.plugins?.language; // KEEP "language"
      scheduleWordOfTheDay(guildId, plugin);
    });
  }, err => {
    console.error("Firestore snapshot error:", err);
  });
});

// --- Welcome & Farewell (keeps same collection naming) ---
client.on("guildMemberAdd", async (member) => {
  try {
    const doc = await db.collection("guilds").doc(member.guild.id).get();
    const welcome = doc.data()?.plugins?.welcome;
    if (welcome?.enabled && welcome?.channelId) {
      const channel = member.guild.channels.cache.get(welcome.channelId) || await member.guild.channels.fetch(welcome.channelId);
      if (channel && channel.permissionsFor(member.guild.members.me || await member.guild.members.fetch(client.user.id))?.has("SendMessages")) {
        channel.send(`Welcome ${member.user.username} to ${member.guild.name}!`);
      }
    }
  } catch (e) {
    console.error("Welcome handler error:", e);
  }
});

client.on("guildMemberRemove", async (member) => {
  try {
    const doc = await db.collection("guilds").doc(member.guild.id).get();
    const farewell = doc.data()?.plugins?.farewell;
    if (farewell?.enabled && farewell?.channelId) {
      const channel = member.guild.channels.cache.get(farewell.channelId) || await member.guild.channels.fetch(farewell.channelId);
      if (channel && channel.permissionsFor(member.guild.members.me || await member.guild.members.fetch(client.user.id))?.has("SendMessages")) {
        channel.send(`${member.user.username} has left the server.`);
      }
    }
  } catch (e) {
    console.error("Farewell handler error:", e);
  }
});

// --- Slash Commands (unchanged) ---
const commands = [
  new SlashCommandBuilder().setName("ping").setDescription("Check if bot is alive"),
  new SlashCommandBuilder().setName("welcome").setDescription("Test welcome message")
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
(async () => {
  try { 
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands }); 
  } catch (err) { 
    console.error(err); 
  }
})();

client.on("interactionCreate", async interaction => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName === "ping") await interaction.reply("Pong!");
  if (interaction.commandName === "welcome") await interaction.reply("This is how welcome messages will appear!");
});

// --- Manual debug endpoint (secure with DEBUG_TOKEN) ---
// POST /debug/send-wotd/:guildId
// Header: x-debug-token: <DEBUG_TOKEN>
app.post("/debug/send-wotd/:guildId", async (req, res) => {
  try {
    const token = req.headers["x-debug-token"];
    if (!process.env.DEBUG_TOKEN) return res.status(500).json({ error: "DEBUG_TOKEN not set in env" });
    if (!token || token !== process.env.DEBUG_TOKEN) return res.status(403).json({ error: "forbidden" });

    const guildId = req.params.guildId;
    const doc = await db.collection("guilds").doc(guildId).get();
    const plugin = doc.exists ? doc.data()?.plugins?.language : null;
    if (!plugin) return res.status(400).json({ error: "no plugin config found" });

    const result = await sendWOTDNow(guildId, plugin);
    return res.json(result);
  } catch (err) {
    console.error("Debug send error:", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

// --- Login & server start ---
client.login(process.env.TOKEN);

// --- Express Server ---
app.get("/", (_req, res) => res.send("Bot is alive"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`Web server listening on port ${PORT}`));
