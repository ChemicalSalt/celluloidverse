require("dotenv").config();
const { Client, GatewayIntentBits, Partials, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require("discord.js");
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

// --- Get Random Word from Sheet ---
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
    if (!guild) return;

    const channel = guild.channels.cache.get(pluginSettings.channelId) || await guild.channels.fetch(pluginSettings.channelId);
    if (!channel) return;

    const me = guild.members.me || await guild.members.fetch(client.user.id);
    if (!channel.permissionsFor(me)?.has("SendMessages")) return;

    const word = await getRandomWord();
    if (!word) return;

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

  const job = cron.schedule(
    `${minute} ${hour} * * *`,
    async () => await sendWOTDNow(guildId, pluginSettings),
    { timezone: pluginSettings.timezone || "Asia/Kolkata" }
  );
  scheduledJobs.set(guildId, job);
}

// --- Placeholder Replacement ---
function formatMessage(message, member, guild) {
  if (!message) return "";
  return message
    .replaceAll("{username}", member.user.username)
    .replaceAll("{usermention}", `<@${member.id}>`)
    .replaceAll("{server}", guild.name)
    .replace(/\{role:([^\}]+)\}/g, (_, roleName) => {
      const role = guild.roles.cache.find(r => r.name === roleName);
      return role ? `<@&${role.id}>` : roleName;
    })
    .replace(/\{channel:([^\}]+)\}/g, (_, channelName) => {
      const channel = guild.channels.cache.find(c => c.name === channelName);
      return channel ? `<#${channel.id}>` : channelName;
    });
}

// --- Bot Ready & Firestore Listener ---
client.once("ready", async () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);

  db.collection("guilds").onSnapshot(snapshot => {
    snapshot.docs.forEach(doc => {
      const guildId = doc.id;
      const plugins = doc.data()?.plugins;
      if (!plugins) return;

      if (plugins.language?.enabled) scheduleWordOfTheDay(guildId, plugins.language);
      else if (scheduledJobs.has(guildId)) {
        scheduledJobs.get(guildId).stop();
        scheduledJobs.delete(guildId);
      }
    });
  });
});

// --- Member Join/Leave ---
client.on("guildMemberAdd", async (member) => {
  try {
    const doc = await db.collection("guilds").doc(member.guild.id).get();
    const welcome = doc.data()?.plugins?.welcome;
    if (!welcome?.enabled) return;

    const guild = member.guild;
    const message = formatMessage(welcome.serverMessage, member, guild);
    if (welcome.channelId) {
      const channel = guild.channels.cache.get(welcome.channelId) || await guild.channels.fetch(welcome.channelId);
      if (channel?.permissionsFor(guild.members.me)?.has("SendMessages")) await channel.send(message);
    }
    if (welcome.dmEnabled && welcome.dmMessage) await member.send(formatMessage(welcome.dmMessage, member, guild));
  } catch (err) { console.error(err); }
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
      if (channel?.permissionsFor(guild.members.me)?.has("SendMessages")) await channel.send(message);
    }
    if (farewell.dmEnabled && farewell.dmMessage) await member.send(formatMessage(farewell.dmMessage, member, guild));
  } catch (err) { console.error(err); }
});

// --- Slash Commands ---
const commands = [
  new SlashCommandBuilder().setName("ping").setDescription("Check bot alive"),
  new SlashCommandBuilder().setName("dashboard").setDescription("Open backend dashboard"),
  new SlashCommandBuilder()
    .setName("sendwotd")
    .setDescription("Send Word of the Day now")
    .addStringOption(opt => opt.setName("channel").setDescription("Channel ID").setRequired(true))
    .addStringOption(opt => opt.setName("time").setDescription("HH:MM format").setRequired(false))
    .addStringOption(opt => opt.setName("timezone").setDescription("IANA timezone").setRequired(false)),
  new SlashCommandBuilder()
    .setName("sendwelcome")
    .setDescription("Send Welcome message now")
    .addStringOption(opt => opt.setName("channel").setDescription("Channel ID").setRequired(true))
    .addStringOption(opt => opt.setName("servermessage").setDescription("Server message").setRequired(false))
    .addStringOption(opt => opt.setName("dmmessage").setDescription("DM message").setRequired(false)),
  new SlashCommandBuilder()
    .setName("sendfarewell")
    .setDescription("Send Farewell message now")
    .addStringOption(opt => opt.setName("channel").setDescription("Channel ID").setRequired(true))
    .addStringOption(opt => opt.setName("servermessage").setDescription("Server message").setRequired(false))
    .addStringOption(opt => opt.setName("dmmessage").setDescription("DM message").setRequired(false)),
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
(async () => {
  try { await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands }); console.log("✅ Slash commands registered"); }
  catch (err) { console.error(err); }
})();

// --- Slash Interaction ---
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const guildId = interaction.guildId;
  const doc = await db.collection("guilds").doc(guildId).get();
  const plugins = doc.data()?.plugins || {};

  try {
    if (interaction.commandName === "ping") {
      const statusDoc = await db.collection("botStatus").doc("main").get();
      const status = statusDoc.data();
      const onlineText = status.online ? "🟢 Online" : "🔴 Offline";
      await interaction.reply(`**Bot Status:** ${onlineText}\nPing: ${status.ping}ms\nServers: ${status.servers}\nLast Update: ${new Date(status.timestamp).toLocaleString()}`);
    }

    if (interaction.commandName === "dashboard") {
      const embed = new EmbedBuilder()
        .setTitle("➡ Open Dashboard")
        .setDescription("Click to access backend dashboard")
        .setURL(process.env.DASHBOARD_URL)
        .setColor(0x00FF00);
      await interaction.reply({ embeds: [embed], ephemeral: false });
    }

    if (interaction.commandName === "sendwotd") {
      const channelId = interaction.options.getString("channel");
      const time = interaction.options.getString("time");
      const timezone = interaction.options.getString("timezone");
      const pluginSettings = { channelId, time, timezone, enabled: true };
      await db.collection("guilds").doc(guildId).set({ plugins: { language: pluginSettings } }, { merge: true });
      scheduleWordOfTheDay(guildId, pluginSettings);
      await sendWOTDNow(guildId, pluginSettings);
      await interaction.reply("✅ Word of the Day sent and settings saved!");
    }

    if (interaction.commandName === "sendwelcome") {
      const channelId = interaction.options.getString("channel");
      const serverMessage = interaction.options.getString("servermessage") || plugins.welcome?.serverMessage;
      const dmMessage = interaction.options.getString("dmmessage") || plugins.welcome?.dmMessage;
      const pluginSettings = { channelId, serverMessage, dmMessage, enabled: true, dmEnabled: !!dmMessage };
      await db.collection("guilds").doc(guildId).set({ plugins: { welcome: pluginSettings } }, { merge: true });

      const message = formatMessage(serverMessage, interaction.member, interaction.guild);
      const channel = interaction.guild.channels.cache.get(channelId) || await interaction.guild.channels.fetch(channelId);
      if (channel?.permissionsFor(interaction.guild.members.me)?.has("SendMessages")) await channel.send(message);
      if (dmMessage) await interaction.member.send(formatMessage(dmMessage, interaction.member, interaction.guild));

      await interaction.reply("✅ Welcome message sent and settings saved!");
    }

    if (interaction.commandName === "sendfarewell") {
      const channelId = interaction.options.getString("channel");
      const serverMessage = interaction.options.getString("servermessage") || plugins.farewell?.serverMessage;
      const dmMessage = interaction.options.getString("dmmessage") || plugins.farewell?.dmMessage;
      const pluginSettings = { channelId, serverMessage, dmMessage, enabled: true, dmEnabled: !!dmMessage };
      await db.collection("guilds").doc(guildId).set({ plugins: { farewell: pluginSettings } }, { merge: true });

      const message = formatMessage(serverMessage, interaction.member, interaction.guild);
      const channel = interaction.guild.channels.cache.get(channelId) || await interaction.guild.channels.fetch(channelId);
      if (channel?.permissionsFor(interaction.guild.members.me)?.has("SendMessages")) await channel.send(message);
      if (dmMessage) await interaction.member.send(formatMessage(dmMessage, interaction.member, interaction.guild));

      await interaction.reply("✅ Farewell message sent and settings saved!");
    }
  } catch (err) {
    console.error(err);
    if (!interaction.replied) await interaction.reply("❌ Something went wrong");
  }
});

// --- Express Health Check ---
app.get("/", (_req, res) => res.send("Bot is alive"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`🌐 Web server on ${PORT}`));

// --- Login ---
client.login(process.env.TOKEN);
