// index.js (DEBUG + Immediate Send)
require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  SlashCommandBuilder,
} = require("discord.js");
const admin = require("firebase-admin");
const express = require("express");
const cron = require("node-cron");
const { google } = require("googleapis");

const app = express();
app.use(express.json());

// --- Initialize Discord Client ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.GuildMember],
});

// --- Initialize Firebase ---
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

// --- Google Sheets Setup ---
const sheetsAuth = new google.auth.GoogleAuth({
  keyFile: "serviceAccountKey.json", // <-- for Sheets only
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
const sheets = google.sheets({ version: "v4", auth: sheetsAuth });
const SPREADSHEET_ID = "1nRaiJ3m0z7o9Wq_zNeUm07v5f_JbbX8oTUkNz085pzg";
const RANGE = "Sheet1!A:H";

async function getRandomWord() {
  try {
    const clientSheets = await sheetsAuth.getClient();
    const res = await sheets.spreadsheets.values.get({
      auth: clientSheets,
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });
    const rows = res.data.values || [];
    if (!rows.length) return null;

    const dataRows = rows.filter((row) => row[0] && row[1]);
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
  } catch (err) {
    console.error("🔥 Error fetching from Google Sheets:", err);
    return null;
  }
}

// --- Cron jobs map ---
const scheduledJobs = new Map();

async function sendWOTDNow(guildId, pluginSettings) {
  try {
    console.log("🚀 Triggered sendWOTDNow for:", guildId, pluginSettings);

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      console.error("❌ Guild not found in cache:", guildId);
      return;
    }

    let channel = guild.channels.cache.get(pluginSettings.channelId);
    if (!channel) {
      try {
        channel = await guild.channels.fetch(pluginSettings.channelId);
      } catch (err) {
        console.error("❌ Failed to fetch channel:", err);
      }
    }
    if (!channel) {
      console.error("❌ Channel not found:", pluginSettings.channelId);
      return;
    }

    const me = guild.members.me || (await guild.members.fetch(client.user.id));
    if (!channel.permissionsFor(me)?.has("SendMessages")) {
      console.error("❌ No permission to send messages in channel:", pluginSettings.channelId);
      return;
    }

    console.log("📡 Fetching word from Google Sheets...");
    const word = await getRandomWord();
    if (!word) {
      console.error("❌ No word fetched from sheet!");
      return;
    }
    console.log("📖 Word fetched:", word);

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
    console.log(`✅ Sent WOTD to guild ${guildId} in channel ${pluginSettings.channelId}`);
  } catch (err) {
    console.error("🔥 Error in sendWOTDNow:", err);
  }
}

function scheduleWordOfTheDay(guildId, pluginSettings) {
  if (!pluginSettings?.enabled || !pluginSettings.channelId || !pluginSettings.time) {
    if (scheduledJobs.has(guildId)) {
      scheduledJobs.get(guildId).stop();
      scheduledJobs.delete(guildId);
    }
    return;
  }

  const [hour, minute] = pluginSettings.time.split(":");
  if (scheduledJobs.has(guildId)) {
    scheduledJobs.get(guildId).stop();
  }

  console.log(`⏰ Scheduling WOTD for guild ${guildId} at ${pluginSettings.time}`);

  const job = cron.schedule(
    `${minute} ${hour} * * *`,
    async () => {
      await sendWOTDNow(guildId, pluginSettings);
    },
    { timezone: process.env.CRON_TZ || "Asia/Kolkata" }
  );

  scheduledJobs.set(guildId, job);

  // 🔥 Send immediately on save (for testing)
  sendWOTDNow(guildId, pluginSettings);
}

// --- Bot Ready ---
client.once("ready", async () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);

  // Firestore live listener: auto-reschedule on updates
  db.collection("guilds").onSnapshot((snapshot) => {
    snapshot.docs.forEach((doc) => {
      const guildId = doc.id;
      const plugin = doc.data()?.plugins?.language;
      scheduleWordOfTheDay(guildId, plugin);
    });
  });
});

// --- Slash Commands ---
const commands = [
  new SlashCommandBuilder().setName("ping").setDescription("Check bot alive"),
].map((cmd) => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
(async () => {
  try {
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });
    console.log("✅ Slash commands registered");
  } catch (err) {
    console.error(err);
  }
})();

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName === "ping") await interaction.reply("Pong!");
});

// --- Express server for health check ---
app.get("/", (_req, res) => res.send("Bot is alive"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🌐 Web server on ${PORT}`)
);

// --- Login ---
client.login(process.env.TOKEN);
