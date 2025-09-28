// index.js
require("dotenv").config();
const { Client, GatewayIntentBits, Partials, REST, Routes, SlashCommandBuilder } = require("discord.js");
const admin = require("firebase-admin");
const express = require("express");
const cron = require("node-cron");
const { google } = require("googleapis");

const app = express();
app.use(express.json());

// --- Discord Client ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.GuildMember],
});

// --- Firebase ---
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// --- Google Sheets ---
const sheetsAuth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT),
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
});
const sheets = google.sheets({ version: "v4", auth: sheetsAuth });
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const RANGE = "Sheet1!A:H";

// --- Get Random Word ---
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

// --- Cron Jobs Map ---
const scheduledJobs = new Map();

// --- Send WOTD ---
async function sendWOTDNow(guildId, pluginSettings) {
  if (!pluginSettings?.enabled) return;
  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return console.error("❌ Guild not in cache:", guildId);

    let channel = guild.channels.cache.get(pluginSettings.channelId);
    if (!channel) {
      try { channel = await guild.channels.fetch(pluginSettings.channelId); } 
      catch (err) { console.error("❌ Failed to fetch channel:", err); return; }
    }
    const me = guild.members.me || (await guild.members.fetch(client.user.id));
    if (!channel.permissionsFor(me)?.has("SendMessages")) return console.error("❌ No permission in channel:", pluginSettings.channelId);

    const word = await getRandomWord();
    if (!word) return console.error("❌ No word fetched for guild:", guildId);

    const message = `📖 **Word of the Day**
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

// --- Schedule WOTD ---
function scheduleWordOfTheDay(guildId, pluginSettings) {
  if (!pluginSettings?.enabled || !pluginSettings.channelId || !pluginSettings.time) {
    if (scheduledJobs.has(guildId)) {
      scheduledJobs.get(guildId).stop();
      scheduledJobs.delete(guildId);
    }
    return;
  }

  const [hour, minute] = pluginSettings.time.split(":");
  if (scheduledJobs.has(guildId)) scheduledJobs.get(guildId).stop();

  console.log(`⏰ Scheduling WOTD for guild ${guildId} at ${pluginSettings.time}`);
  const job = cron.schedule(
    `${minute} ${hour} * * *`,
    async () => await sendWOTDNow(guildId, pluginSettings),
    { timezone: process.env.CRON_TZ || "Asia/Kolkata" }
  );
  scheduledJobs.set(guildId, job);
}

// --- Replace placeholders ---
// --- Replace placeholders ---
function formatMessage(message, member, guild) {
  if (!message) return "";

  return message
    .replaceAll("{username}", member.user.username)
    .replaceAll("{usermention}", `<@${member.id}>`)
    .replaceAll("{server}", guild.name)
    // Role mentions
    .replace(/\{role:([^\}]+)\}/g, (_, roleName) => {
      const role = guild.roles.cache.find(r => r.name === roleName);
      return role ? `<@&${role.id}>` : roleName; // clickable if role exists
    })
    // Channel mentions
    .replace(/\{channel:([^\}]+)\}/g, (_, channelName) => {
      const channel = guild.channels.cache.find(c => c.name === channelName);
      return channel ? `<#${channel.id}>` : channelName; // clickable if channel exists
    });
}



// --- Bot Ready & Firestore Listener ---
client.once("ready", async () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);

  db.collection("guilds").onSnapshot((snapshot) => {
    snapshot.docs.forEach(async (doc) => {
      const guildId = doc.id;
      const plugins = doc.data()?.plugins;
      const guild = client.guilds.cache.get(guildId);
      if (!guild) return;

      // Schedule WOTD
      if (plugins?.language?.enabled) scheduleWordOfTheDay(guildId, plugins.language);
      else if (scheduledJobs.has(guildId)) {
        scheduledJobs.get(guildId).stop();
        scheduledJobs.delete(guildId);
      }
    });
  });
});

// --- Member Join & Leave ---
client.on("guildMemberAdd", async (member) => {
  try {
    const doc = await db.collection("guilds").doc(member.guild.id).get();
    const welcome = doc.data()?.plugins?.welcome;
    if (!welcome?.enabled) return;

    const guild = member.guild;
    const message = formatMessage(welcome.serverMessage, member, guild);
    if (welcome.channelId) {
      const channel = guild.channels.cache.get(welcome.channelId) || await guild.channels.fetch(welcome.channelId);
      if (channel?.permissionsFor(guild.members.me)?.has("SendMessages")) {
        await channel.send(message);
      }
    }

    if (welcome.dmEnabled && welcome.dmMessage) {
      await member.send(formatMessage(welcome.dmMessage, member, guild));
    }
  } catch (err) {
    console.error("🔥 Error in guildMemberAdd:", err);
  }
});

client.on("guildMemberRemove", async (member) => {
  try {
    const doc = await db.collection("guilds").doc(member.guild.id).get();
    const farewell = doc.data()?.plugins?.farewell;
    if (!farewell?.enabled) return;

    const guild = member.guild;
    const message = formatMessage(farewell.serverMessage, member, guild);
    if (farewell.channelId) {
      const channel = guild.channels.cache.get(farewell.channelId) || await guild.channels.fetch(farewell.channelId);
      if (channel?.permissionsFor(guild.members.me)?.has("SendMessages")) {
        await channel.send(message);
      }
    }

    if (farewell.dmEnabled && farewell.dmMessage) {
      await member.send(formatMessage(farewell.dmMessage, member, guild));
    }
  } catch (err) {
    console.error("🔥 Error in guildMemberRemove:", err);
  }
});

// --- Backend API for Plugin Settings ---
app.post("/api/plugin-settings", async (req, res) => {
  try {
    const { guildId, channelId, time, language, enabled } = req.body;
    if (!guildId || !channelId || !time) return res.status(400).send({ success: false, message: "guildId, channelId, time required" });

    await db.collection("guilds").doc(guildId).set({
      plugins: { language: { channelId, time, language, enabled, updatedAt: new Date() } }
    }, { merge: true });

    scheduleWordOfTheDay(guildId, { channelId, time, language, enabled });
    res.status(200).send({ success: true, message: "Settings saved and WOTD scheduled!" });
  } catch (err) {
    console.error("🔥 Error saving plugin settings:", err);
    res.status(500).send({ success: false, error: err.message });
  }
});

// --- Slash Commands ---
const commands = [
  new SlashCommandBuilder().setName("ping").setDescription("Check bot alive"),
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
(async () => {
  try { await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands }); }
  catch (err) { console.error(err); }
})();

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === "ping") {
    try {
      const doc = await db.collection("botStatus").doc("main").get();
      if (!doc.exists) return await interaction.reply("Bot status not found");

      const status = doc.data();
      const onlineText = status.online ? "🟢 Online" : "🔴 Offline";

      await interaction.reply(
        `**Bot Status:**\n` +
        `Signal: ${onlineText}\n` +
        `Ping: ${status.ping} ms\n` +
        `Servers: ${status.servers}\n` +
        `Last Update: ${new Date(status.timestamp).toLocaleString()}`
      );
    } catch (err) {
      console.error("Error fetching bot status:", err);
      await interaction.reply("❌ Failed to fetch bot status");
    }
  }
});


// --- Express Health Check ---
app.get("/", (_req, res) => res.send("Bot is alive"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`🌐 Web server on ${PORT}`));

// --- Login ---
client.login(process.env.TOKEN);
