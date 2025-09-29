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

// --- Get Random Word ---
async function getRandomWord() {
  try {
    const clientSheets = await sheetsAuth.getClient();
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: RANGE, auth: clientSheets });
    const rows = res.data.values || [];
    if (!rows.length) return null;
    const dataRows = rows.filter(r => r[0] && r[1]);
    const row = dataRows[Math.floor(Math.random() * dataRows.length)];
    return {
      kanji: row[0] || "", hiragana: row[1] || "", romaji: row[2] || "",
      meaning: row[3] || "", sentenceJP: row[4] || "", sentenceHiragana: row[5] || "",
      sentenceRomaji: row[6] || "", sentenceMeaning: row[7] || ""
    };
  } catch (err) { console.error("🔥 Error fetching from Google Sheets:", err); return null; }
}

// --- Cron Jobs Map ---
const scheduledJobs = new Map();

// --- Helper: Clean channel ID ---
function cleanChannelId(raw) {
  if (!raw) return null;
  return raw.replace(/[^0-9]/g, ""); // remove <#>
}

// --- Send WOTD ---
async function sendWOTDNow(guildId, pluginSettings) {
  if (!pluginSettings?.enabled) return;
  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;
    const channelId = cleanChannelId(pluginSettings.channelId);
    const channel = guild.channels.cache.get(channelId) || await guild.channels.fetch(channelId);
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
  } catch (err) { console.error("🔥 Error in sendWOTDNow:", err); }
}

// --- Schedule WOTD ---
function scheduleWordOfTheDay(guildId, pluginSettings) {
  if (!pluginSettings?.enabled || !pluginSettings.channelId || !pluginSettings.time) {
    if (scheduledJobs.has(guildId)) { scheduledJobs.get(guildId).stop(); scheduledJobs.delete(guildId); }
    return;
  }

  const [hour, minute] = pluginSettings.time.split(":").map(Number);
  if (isNaN(hour) || isNaN(minute)) return console.error("❌ Invalid WOTD time:", pluginSettings.time);
  if (scheduledJobs.has(guildId)) { scheduledJobs.get(guildId).stop(); scheduledJobs.delete(guildId); }

  const tz = pluginSettings.timezone || "UTC";

  try {
    const job = cron.schedule(
      `${minute} ${hour} * * *`,
      async () => await sendWOTDNow(guildId, pluginSettings),
      { timezone: tz }
    );
    scheduledJobs.set(guildId, job);
  } catch (err) {
    console.error("🔥 Failed to schedule WOTD:", err, "Timezone:", tz);
  }
}

// --- Placeholder Replacement ---
function formatMessage(msg, member, guild) {
  if (!msg) return "";
  return msg
    .replaceAll("{username}", member.user.username)
    .replaceAll("{usermention}", `<@${member.id}>`)
    .replaceAll("{server}", guild.name)
    .replace(/\{role:([^\}]+)\}/g, (_, r) => { const role = guild.roles.cache.find(x => x.name === r); return role ? `<@&${role.id}>` : r; })
    .replace(/\{channel:([^\}]+)\}/g, (_, c) => { const ch = guild.channels.cache.find(x => x.name === c); return ch ? `<#${ch.id}>` : c; });
}

// --- Bot Ready & Firestore Listener ---
client.once("ready", async () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);
  db.collection("guilds").onSnapshot(snapshot => {
    snapshot.docs.forEach(doc => {
      const gid = doc.id;
      const plugins = doc.data()?.plugins;
      if (!plugins) return;
      if (plugins.language?.enabled) scheduleWordOfTheDay(gid, plugins.language);
      else if (scheduledJobs.has(gid)) { scheduledJobs.get(gid).stop(); scheduledJobs.delete(gid); }
    });
  });
});

// --- Member Join/Leave ---
client.on("guildMemberAdd", async m => {
  try {
    const doc = await db.collection("guilds").doc(m.guild.id).get();
    const w = doc.data()?.plugins?.welcome; if (!w?.enabled) return;
    const msg = formatMessage(w.serverMessage, m, m.guild);
    const chId = cleanChannelId(w.channelId);
    if (chId) {
      const ch = m.guild.channels.cache.get(chId) || await m.guild.channels.fetch(chId);
      if (ch?.permissionsFor(m.guild.members.me)?.has("SendMessages")) await ch.send(msg);
    }
    if (w.dmEnabled && w.dmMessage) await m.send(formatMessage(w.dmMessage, m, m.guild));
  } catch (err) { console.error(err); }
});
client.on("guildMemberRemove", async m => {
  try {
    const doc = await db.collection("guilds").doc(m.guild.id).get();
    const f = doc.data()?.plugins?.farewell; if (!f?.enabled) return;
    const msg = formatMessage(f.serverMessage, m, m.guild);
    const chId = cleanChannelId(f.channelId);
    if (chId) {
      const ch = m.guild.channels.cache.get(chId) || await m.guild.channels.fetch(chId);
      if (ch?.permissionsFor(m.guild.members.me)?.has("SendMessages")) await ch.send(msg);
    }
    if (f.dmEnabled && f.dmMessage) await m.send(formatMessage(f.dmMessage, m, m.guild));
  } catch (err) { console.error(err); }
});

// --- Slash Commands ---
const commands = [
  new SlashCommandBuilder().setName("ping").setDescription("Check bot alive"),
  new SlashCommandBuilder().setName("dashboard").setDescription("Open backend dashboard"),
  new SlashCommandBuilder()
    .setName("sendwotd").setDescription("Send Word of the Day now")
    .addStringOption(o => o.setName("channel").setDescription("Channel ID").setRequired(true))
    .addStringOption(o => o.setName("time").setDescription("HH:MM format").setRequired(false))
    .addStringOption(o => o.setName("timezone").setDescription("IANA timezone").setRequired(false)),
  new SlashCommandBuilder()
    .setName("sendwelcome").setDescription("Send Welcome message now")
    .addStringOption(o => o.setName("channel").setDescription("Channel ID").setRequired(true))
    .addStringOption(o => o.setName("servermessage").setDescription("Server message").setRequired(false))
    .addStringOption(o => o.setName("dmmessage").setDescription("DM message").setRequired(false)),
  new SlashCommandBuilder()
    .setName("sendfarewell").setDescription("Send Farewell message now")
    .addStringOption(o => o.setName("channel").setDescription("Channel ID").setRequired(true))
    .addStringOption(o => o.setName("servermessage").setDescription("Server message").setRequired(false))
    .addStringOption(o => o.setName("dmmessage").setDescription("DM message").setRequired(false))
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
(async () => { try { await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands }); console.log("✅ Slash commands registered"); } catch (err) { console.error(err); } })();

// --- Slash Interaction ---
client.on("interactionCreate", async i => {
  if (!i.isCommand()) return;
  const gid = i.guildId; const doc = await db.collection("guilds").doc(gid).get();
  const plugins = doc.data()?.plugins || {};

  try {
    if (i.commandName === "ping") {
      const s = (await db.collection("botStatus").doc("main").get()).data();
      await i.reply(`**Bot Status:** ${s.online ? "🟢 Online" : "🔴 Offline"}\nPing: ${s.ping}ms\nServers: ${s.servers}\nLast Update: ${new Date(s.timestamp).toLocaleString()}`);
    }

    if (i.commandName === "dashboard") {
      await i.reply({ embeds: [new EmbedBuilder().setTitle("➡ Open Dashboard").setDescription("Click to access backend dashboard").setURL(process.env.DASHBOARD_URL).setColor(0x00FF00)], ephemeral: false });
    }

    if (i.commandName === "sendwotd") {
      const channelId = cleanChannelId(i.options.getString("channel")), time = i.options.getString("time"), tz = i.options.getString("timezone");
      const p = { channelId, time, timezone: tz, enabled: true };
      await db.collection("guilds").doc(gid).set({ plugins: { language: p } }, { merge: true });
      scheduleWordOfTheDay(gid, p); await sendWOTDNow(gid, p); await i.reply("✅ Word of the Day sent and settings saved!");
    }

    if (i.commandName === "sendwelcome") {
      const channelId = cleanChannelId(i.options.getString("channel"));
      const serverMsg = i.options.getString("servermessage") || plugins.welcome?.serverMessage;
      const dmMsg = i.options.getString("dmmessage") || plugins.welcome?.dmMessage;
      const p = { channelId, serverMessage: serverMsg, dmMessage: dmMsg, enabled: true, dmEnabled: !!dmMsg };
      await db.collection("guilds").doc(gid).set({ plugins: { welcome: p } }, { merge: true });
      const msg = formatMessage(serverMsg, i.member, i.guild);
      const ch = i.guild.channels.cache.get(channelId) || await i.guild.channels.fetch(channelId);
      if (ch?.permissionsFor(i.guild.members.me)?.has("SendMessages")) await ch.send(msg);
      if (dmMsg) await i.member.send(formatMessage(dmMsg, i.member, i.guild));
      await i.reply("✅ Welcome message sent and settings saved!");
    }

    if (i.commandName === "sendfarewell") {
      const channelId = cleanChannelId(i.options.getString("channel"));
      const serverMsg = i.options.getString("servermessage") || plugins.farewell?.serverMessage;
      const dmMsg = i.options.getString("dmmessage") || plugins.farewell?.dmMessage;
      const p = { channelId, serverMessage: serverMsg, dmMessage: dmMsg, enabled: true, dmEnabled: !!dmMsg };
      await db.collection("guilds").doc(gid).set({ plugins: { farewell: p } }, { merge: true });
      const msg = formatMessage(serverMsg, i.member, i.guild);
      const ch = i.guild.channels.cache.get(channelId) || await i.guild.channels.fetch(channelId);
      if (ch?.permissionsFor(i.guild.members.me)?.has("SendMessages")) await ch.send(msg);
      if (dmMsg) await i.member.send(formatMessage(dmMsg, i.member, i.guild));
      await i.reply("✅ Farewell message sent and settings saved!");
    }
  } catch (err) { console.error(err); if (!i.replied) await i.reply("❌ Something went wrong"); }
});

// --- Express Health Check ---
app.get("/", (_req, res) => res.send("Bot is alive"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`🌐 Web server on ${PORT}`));

// --- Login ---
client.login(process.env.TOKEN);
