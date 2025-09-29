// index.js (final)
require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");
const admin = require("firebase-admin");
const express = require("express");
const cron = require("node-cron");
const { google } = require("googleapis");

// --- Express ---
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

// --- Firebase (admin) ---
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

// --- Google Sheets (Japanese WOTD) ---
const sheetsAuth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT),
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
const sheets = google.sheets({ version: "v4", auth: sheetsAuth });
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const RANGE = "Sheet1!A:H";

// --- Helpers ---
function cleanChannelId(id) {
  if (!id) return null;
  return id.replace(/[^0-9]/g, "");
}

function formatMessage(msg, member, guild) {
  if (!msg) return "";
  return msg
    .replaceAll("{username}", member.user.username)
    .replaceAll("{usermention}", `<@${member.id}>`)
    .replaceAll("{server}", guild.name)
    .replace(/\{role:([^\}]+)\}/g, (_, r) => {
      const role = guild.roles.cache.find((x) => x.name === r);
      return role ? `<@&${role.id}>` : r;
    })
    .replace(/\{channel:([^\}]+)\}/g, (_, c) => {
      const ch = guild.channels.cache.find((x) => x.name === c);
      return ch ? `<#${ch.id}>` : c;
    });
}

// --- Get Random Word (Japanese only) ---
async function getRandomWord() {
  try {
    const clientSheets = await sheetsAuth.getClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
      auth: clientSheets,
    });
    const rows = res.data.values || [];
    if (!rows.length) return null;
    const dataRows = rows.filter((r) => r[0] && r[1]);
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

// --- Cron Jobs Map (key: wotd:<guildId>) ---
const scheduledJobs = new Map();

// --- Schedule WOTD ---
function scheduleWordOfTheDay(guildId, plugin) {
  const key = `wotd:${guildId}`;

  // plugin may be null/undefined
  if (!plugin || !plugin.enabled || !plugin.channelId || !plugin.time) {
    if (scheduledJobs.has(key)) {
      scheduledJobs.get(key).stop();
      scheduledJobs.delete(key);
      console.log(`[WOTD] ❌ Stopped schedule for guild ${guildId}`);
    }
    return;
  }

  // parse time HH:MM
  const parts = (plugin.time || "").split(":").map((s) => Number(s));
  if (parts.length !== 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) {
    return console.error(`[WOTD] ⚠ Invalid time for guild ${guildId}:`, plugin.time);
  }
  const [hour, minute] = parts;

  // remove old job
  if (scheduledJobs.has(key)) {
    scheduledJobs.get(key).stop();
    scheduledJobs.delete(key);
  }

  try {
    const expr = `${minute} ${hour} * * *`; // runs daily at UTC hour:minute
    const job = cron.schedule(
      expr,
      async () => {
        console.log(`[WOTD] ⚡ Triggering send for guild ${guildId} at ${plugin.time} UTC`);
        try {
          await sendWOTDNow(guildId, plugin);
        } catch (e) {
          console.error("[WOTD] send error:", e);
        }
      },
      { timezone: "UTC" }
    );
    scheduledJobs.set(key, job);
    console.log(`[WOTD] ✅ Scheduled for guild ${guildId} at ${plugin.time} UTC (key=${key})`);
  } catch (err) {
    console.error("🔥 Failed to schedule WOTD:", err);
  }
}

// --- Send WOTD Now ---
async function sendWOTDNow(guildId, plugin) {
  if (!plugin?.enabled) return;
  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return console.warn(`[WOTD] Guild not found in cache: ${guildId}`);

    const channel =
      guild.channels.cache.get(plugin.channelId) ||
      (await guild.channels.fetch(plugin.channelId).catch(() => null));
    if (!channel) return console.warn(`[WOTD] Channel not found: ${plugin.channelId}`);

    const me = guild.members.me || (await guild.members.fetch(client.user.id).catch(() => null));
    if (!me || !channel.permissionsFor(me)?.has("SendMessages")) {
      return console.warn(`[WOTD] Missing send permission in ${plugin.channelId}`);
    }

    const word = await getRandomWord();
    if (!word) return console.warn(`[WOTD] No word available`);

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
    console.log(`[WOTD] ✅ Sent to guild ${guildId} channel ${plugin.channelId}`);
  } catch (err) {
    console.error("🔥 Error sending WOTD:", err);
  }
}

// --- Welcome / Farewell Handlers ---
async function handleWelcome(member, plugin) {
  if (!plugin?.enabled) return;
  if (plugin.sendInServer && plugin.serverMessage && plugin.channelId) {
    const msg = formatMessage(plugin.serverMessage, member, member.guild);
    const ch =
      member.guild.channels.cache.get(plugin.channelId) ||
      (await member.guild.channels.fetch(plugin.channelId).catch(() => null));
    if (ch?.permissionsFor(member.guild.members.me)?.has("SendMessages")) {
      await ch.send(msg).catch((e) => console.error("Welcome send error:", e));
    }
  }
  if (plugin.sendInDM && plugin.dmMessage) {
    await member.send(formatMessage(plugin.dmMessage, member, member.guild)).catch(() => {});
  }
}

async function handleFarewell(member, plugin) {
  if (!plugin?.enabled) return;
  if (plugin.sendInServer && plugin.serverMessage && plugin.channelId) {
    const msg = formatMessage(plugin.serverMessage, member, member.guild);
    const ch =
      member.guild.channels.cache.get(plugin.channelId) ||
      (await member.guild.channels.fetch(plugin.channelId).catch(() => null));
    if (ch?.permissionsFor(member.guild.members.me)?.has("SendMessages")) {
      await ch.send(msg).catch((e) => console.error("Farewell send error:", e));
    }
  }
  if (plugin.sendInDM && plugin.dmMessage) {
    await member.send(formatMessage(plugin.dmMessage, member, member.guild)).catch(() => {});
  }
}

// --- Events: member join/leave ---
client.on("guildMemberAdd", async (m) => {
  try {
    const doc = await db.collection("guilds").doc(m.guild.id).get();
    await handleWelcome(m, doc.data()?.plugins?.welcome);
  } catch (err) {
    console.error(err);
  }
});

client.on("guildMemberRemove", async (m) => {
  try {
    const doc = await db.collection("guilds").doc(m.guild.id).get();
    await handleFarewell(m, doc.data()?.plugins?.farewell);
  } catch (err) {
    console.error(err);
  }
});

// --- Bot ready: schedule existing language configs & watch for changes ---
client.once("ready", async () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);

  // On startup, schedule existing language configs
  try {
    const snapshot = await db.collection("guilds").get();
    snapshot.docs.forEach((doc) => {
      const gid = doc.id;
      const plugins = doc.data()?.plugins || {};
      // prefer plugins.language, fallback to plugins.wotd (backwards compat)
      const lang = plugins.language || plugins.wotd;
      if (lang?.enabled) scheduleWordOfTheDay(gid, lang);
    });
  } catch (err) {
    console.error("🔥 Error loading guild configs on startup:", err);
  }

  // Live watcher: when guild docs change, reschedule
  db.collection("guilds").onSnapshot((snap) => {
    snap.docChanges().forEach((change) => {
      const gid = change.doc.id;
      const plugins = change.doc.data()?.plugins || {};
      const lang = plugins.language || plugins.wotd;
      scheduleWordOfTheDay(gid, lang);
    });
  });
});

// --- Slash Commands ---
const commands = [
  new SlashCommandBuilder().setName("ping").setDescription("Check bot alive"),
  new SlashCommandBuilder().setName("dashboard").setDescription("Open dashboard"),

  new SlashCommandBuilder()
    .setName("sendwotd")
    .setDescription("Setup Word of the Day (Japanese only, UTC time)")
    .addStringOption((o) =>
      o.setName("channel").setDescription("Channel ID or #channel").setRequired(true)
    )
    .addStringOption((o) =>
      o.setName("time").setDescription("HH:MM 24h format (UTC)").setRequired(true)
    )
    .addStringOption((o) =>
      o.setName("language").setDescription("Pick language").setRequired(true).addChoices({
        name: "Japanese",
        value: "japanese",
      })
    ),

  new SlashCommandBuilder()
    .setName("sendwelcome")
    .setDescription("Setup Welcome message")
    .addStringOption((o) => o.setName("channel").setDescription("Channel ID or #channel").setRequired(true))
    .addBooleanOption((o) => o.setName("send_in_server").setDescription("Send in server?").setRequired(true))
    .addBooleanOption((o) => o.setName("send_in_dm").setDescription("Send in DM?").setRequired(true))
    .addStringOption((o) => o.setName("servermessage").setDescription("Server message").setRequired(false))
    .addStringOption((o) => o.setName("dmmessage").setDescription("DM message").setRequired(false)),

  new SlashCommandBuilder()
    .setName("sendfarewell")
    .setDescription("Setup Farewell message")
    .addStringOption((o) => o.setName("channel").setDescription("Channel ID or #channel").setRequired(true))
    .addBooleanOption((o) => o.setName("send_in_server").setDescription("Send in server?").setRequired(true))
    .addBooleanOption((o) => o.setName("send_in_dm").setDescription("Send in DM?").setRequired(true))
    .addStringOption((o) => o.setName("servermessage").setDescription("Server message").setRequired(false))
    .addStringOption((o) => o.setName("dmmessage").setDescription("DM message").setRequired(false)),
].map((c) => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
(async () => {
  try {
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log("✅ Slash commands registered");
  } catch (err) {
    console.error("🔥 Slash registration error:", err);
  }
})();

// --- Slash Interaction Handler ---
client.on("interactionCreate", async (i) => {
  if (!i.isCommand()) return;
  const gid = i.guildId;

  // load the guild plugins (if any)
  const docSnap = await db.collection("guilds").doc(gid).get();
  const plugins = docSnap.exists ? (docSnap.data()?.plugins || {}) : {};

  try {
    if (i.commandName === "ping") {
      return i.reply("🏓 Pong!");
    }

    if (i.commandName === "dashboard") {
      return i.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("➡ Open Dashboard")
            .setDescription("Click to access backend dashboard")
            .setURL(process.env.DASHBOARD_URL)
            .setColor(0x00ff00),
        ],
        ephemeral: true,
      });
    }

    if (i.commandName === "sendwotd") {
      const channelId = cleanChannelId(i.options.getString("channel"));
      const time = i.options.getString("time");
      const language = i.options.getString("language") || "japanese";

      const p = { channelId, time, language, enabled: true };

      // save under plugins.language (merge with existing plugins)
      await db.collection("guilds").doc(gid).set(
        { plugins: { ...plugins, language: p } },
        { merge: true }
      );

      // schedule now and also attempt immediate send so user can verify
      scheduleWordOfTheDay(gid, p);
      try {
        await sendWOTDNow(gid, p);
      } catch (err) {
        // if immediate send fails, scheduling will handle future sends
        console.warn("[WOTD] immediate send failed (will rely on scheduled job):", err);
      }

      return i.reply({ content: `✅ WOTD saved. Runs daily at ${time} UTC. Sent a test now (if permitted).`, ephemeral: true });
    }

    if (i.commandName === "sendwelcome") {
      const channelId = cleanChannelId(i.options.getString("channel"));
      const serverMsg = i.options.getString("servermessage") || plugins.welcome?.serverMessage;
      const dmMsg = i.options.getString("dmmessage") || plugins.welcome?.dmMessage;
      const sendInServer = i.options.getBoolean("send_in_server");
      const sendInDM = i.options.getBoolean("send_in_dm");

      const p = { channelId, serverMessage: serverMsg, dmMessage: dmMsg, enabled: true, sendInServer, sendInDM };

      await db.collection("guilds").doc(gid).set(
        { plugins: { ...plugins, welcome: p } },
        { merge: true }
      );

      return i.reply({ content: "✅ Welcome settings saved!", ephemeral: true });
    }

    if (i.commandName === "sendfarewell") {
      const channelId = cleanChannelId(i.options.getString("channel"));
      const serverMsg = i.options.getString("servermessage") || plugins.farewell?.serverMessage;
      const dmMsg = i.options.getString("dmmessage") || plugins.farewell?.dmMessage;
      const sendInServer = i.options.getBoolean("send_in_server");
      const sendInDM = i.options.getBoolean("send_in_dm");

      const p = { channelId, serverMessage: serverMsg, dmMessage: dmMsg, enabled: true, sendInServer, sendInDM };

      await db.collection("guilds").doc(gid).set(
        { plugins: { ...plugins, farewell: p } },
        { merge: true }
      );

      return i.reply({ content: "✅ Farewell settings saved!", ephemeral: true });
    }
  } catch (err) {
    console.error("🔥 Interaction handler error:", err);
    if (!i.replied) return i.reply({ content: "❌ Something went wrong", ephemeral: true });
  }
});

// --- Health check + login ---
app.get("/", (_req, res) => res.send("Bot is alive"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`🌐 Web server on ${PORT}`));

client.login(process.env.TOKEN);
