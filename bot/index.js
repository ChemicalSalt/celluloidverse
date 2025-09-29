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

// --- Firebase ---
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (!admin.apps.length)
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// --- Google Sheets (WOTD) ---
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
  return id.replace(/[^0-9]/g, ""); // strip <#>
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

// --- Get Random Word (Japanese sheet) ---
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

// --- Send WOTD Now ---
async function sendWOTDNow(guildId, plugin) {
  if (!plugin?.enabled) return;
  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      console.warn(`[WOTD] Guild not in cache: ${guildId}`);
      return;
    }
    const channel =
      guild.channels.cache.get(plugin.channelId) ||
      (await guild.channels.fetch(plugin.channelId).catch(() => null));
    if (!channel) {
      console.warn(`[WOTD] Channel not found for guild ${guildId}: ${plugin.channelId}`);
      return;
    }
    const me = guild.members.me || (await guild.members.fetch(client.user.id).catch(() => null));
    if (!me || !channel.permissionsFor(me)?.has("SendMessages")) {
      console.warn(`[WOTD] Missing send permission in ${plugin.channelId} for guild ${guildId}`);
      return;
    }

    // Only Japanese for now
    const word = await getRandomWord();
    if (!word) {
      console.warn(`[WOTD] No word available for guild ${guildId}`);
      return;
    }

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
    console.log(`[WOTD] Sent to guild ${guildId} channel ${plugin.channelId}`);
  } catch (err) {
    console.error("🔥 Error sending WOTD:", err);
  }
}

// --- Check & Send Loop ---
// Runs every 60 seconds and posts WOTD when UTC HH:MM matches plugin.time.
// Marks plugins.wotd.lastSentDate so we don't re-send within same UTC day.
async function checkAndSendWOTDAll() {
  try {
    const now = new Date();
    const hh = String(now.getUTCHours()).padStart(2, "0");
    const mm = String(now.getUTCMinutes()).padStart(2, "0");
    const timeNow = `${hh}:${mm}`;
    const today = now.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)

    const snapshot = await db.collection("guilds").get();
    for (const doc of snapshot.docs) {
      const gid = doc.id;
      const plugins = doc.data()?.plugins || {};
      const wotd = plugins.wotd || plugins.language; // support both keys
      if (!wotd || !wotd.enabled || !wotd.channelId || !wotd.time) continue;
      // only trigger when time matches exactly UTC HH:MM
      if ((wotd.time || "").trim() !== timeNow) continue;
      // avoid duplicate sends during same day
      if (wotd.lastSentDate === today) continue;

      console.log(`[WOTD] Time match for guild ${gid} (${timeNow} UTC). Sending...`);
      await sendWOTDNow(gid, wotd);

      // update the lastSentDate under whichever key exists
      const docRef = db.collection("guilds").doc(gid);
      try {
        if (plugins.wotd) {
          await docRef.update({ "plugins.wotd.lastSentDate": today });
        } else {
          await docRef.update({ "plugins.language.lastSentDate": today });
        }
        console.log(`[WOTD] Updated lastSentDate for guild ${gid} -> ${today}`);
      } catch (uErr) {
        // fallback: try set with merge
        try {
          if (plugins.wotd) {
            await docRef.set({ plugins: { wotd: { lastSentDate: today } } }, { merge: true });
          } else {
            await docRef.set({ plugins: { language: { lastSentDate: today } } }, { merge: true });
          }
        } catch (se) {
          console.error(`[WOTD] Failed to persist lastSentDate for guild ${gid}:`, se);
        }
      }
    }
  } catch (err) {
    console.error("[WOTD] check loop error:", err);
  }
}

// start the minute loop (once ready)
let wotdInterval = null;

// --- Welcome/Farewell Handlers ---
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

// --- Events ---
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

// --- Bot Ready & Start Loop ---
client.once("ready", async () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);

  // run initial check immediately on startup
  await checkAndSendWOTDAll().catch((e) => console.error("[WOTD] initial check error:", e));

  // start interval (runs every 60 seconds)
  if (wotdInterval) clearInterval(wotdInterval);
  wotdInterval = setInterval(checkAndSendWOTDAll, 60 * 1000);

  // watch for plugin changes and log (optional)
  db.collection("guilds").onSnapshot((snap) => {
    snap.docChanges().forEach((change) => {
      const gid = change.doc.id;
      const plugins = change.doc.data()?.plugins || {};
      const wotd = plugins.wotd || plugins.language;
      if (wotd && wotd.enabled) {
        console.log(`[WOTD] Config present for guild ${gid}: time=${wotd.time} channel=${wotd.channelId}`);
      }
    });
  });
});

// --- Slash Commands ---
const commands = [
  new SlashCommandBuilder().setName("ping").setDescription("Check bot alive"),

  new SlashCommandBuilder()
    .setName("dashboard")
    .setDescription("Open dashboard"),

  new SlashCommandBuilder()
    .setName("sendwotd")
    .setDescription("Setup Word of the Day (Japanese only, time is UTC)")
    .addStringOption((o) =>
      o.setName("channel")
        .setDescription("Channel ID or #channel")
        .setRequired(true)
    )
    .addStringOption((o) =>
      o.setName("time")
        .setDescription("HH:MM 24h format (UTC)")
        .setRequired(true)
    )
    .addStringOption((o) =>
      o.setName("language")
        .setDescription("Pick language for Word of the Day")
        .setRequired(true)
        .addChoices({ name: "Japanese", value: "japanese" })
    ),

  new SlashCommandBuilder()
    .setName("sendwelcome")
    .setDescription("Setup Welcome message")
    .addStringOption((o) =>
      o.setName("channel")
        .setDescription("Channel ID or #channel")
        .setRequired(true)
    )
    .addBooleanOption((o) =>
      o.setName("send_in_server").setDescription("Send in server?").setRequired(true)
    )
    .addBooleanOption((o) =>
      o.setName("send_in_dm").setDescription("Send in DMs?").setRequired(true)
    )
    .addStringOption((o) =>
      o.setName("servermessage")
        .setDescription("Server message (use placeholders)")
        .setRequired(false)
    )
    .addStringOption((o) =>
      o.setName("dmmessage")
        .setDescription("DM message (use placeholders)")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("sendfarewell")
    .setDescription("Setup Farewell message")
    .addStringOption((o) =>
      o.setName("channel")
        .setDescription("Channel ID or #channel")
        .setRequired(true)
    )
    .addBooleanOption((o) =>
      o.setName("send_in_server").setDescription("Send in server?").setRequired(true)
    )
    .addBooleanOption((o) =>
      o.setName("send_in_dm").setDescription("Send in DMs?").setRequired(true)
    )
    .addStringOption((o) =>
      o.setName("servermessage")
        .setDescription("Server message (use placeholders)")
        .setRequired(false)
    )
    .addStringOption((o) =>
      o.setName("dmmessage")
        .setDescription("DM message (use placeholders)")
        .setRequired(false)
    ),
].map((c) => c.toJSON());

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

// --- Slash Interaction ---
client.on("interactionCreate", async (i) => {
  if (!i.isCommand()) return;
  const gid = i.guildId;
  const doc = await db.collection("guilds").doc(gid).get();
  const plugins = doc.data()?.plugins || {};

  try {
    if (i.commandName === "ping") {
      await i.reply("🏓 Pong!");
    }

    if (i.commandName === "dashboard") {
      await i.reply({
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
      // Save under plugins.wotd (preferred)
      await db.collection("guilds").doc(gid).set({ plugins: { wotd: p } }, { merge: true });

      await i.reply({ content: "✅ WOTD settings saved (Japanese). It will run at the UTC time you provided.", ephemeral: true });
      console.log(`[WOTD] Saved WOTD config for guild ${gid}:`, p);
    }

    if (i.commandName === "sendwelcome") {
      const channelId = cleanChannelId(i.options.getString("channel"));
      const serverMsg = i.options.getString("servermessage") || plugins.welcome?.serverMessage;
      const dmMsg = i.options.getString("dmmessage") || plugins.welcome?.dmMessage;
      const sendInServer = i.options.getBoolean("send_in_server");
      const sendInDM = i.options.getBoolean("send_in_dm");

      const p = {
        channelId,
        serverMessage: serverMsg,
        dmMessage: dmMsg,
        enabled: true,
        sendInServer,
        sendInDM,
      };
      await db.collection("guilds").doc(gid).set({ plugins: { welcome: p } }, { merge: true });
      await i.reply({ content: "✅ Welcome settings saved!", ephemeral: true });
    }

    if (i.commandName === "sendfarewell") {
      const channelId = cleanChannelId(i.options.getString("channel"));
      const serverMsg = i.options.getString("servermessage") || plugins.farewell?.serverMessage;
      const dmMsg = i.options.getString("dmmessage") || plugins.farewell?.dmMessage;
      const sendInServer = i.options.getBoolean("send_in_server");
      const sendInDM = i.options.getBoolean("send_in_dm");

      const p = {
        channelId,
        serverMessage: serverMsg,
        dmMessage: dmMsg,
        enabled: true,
        sendInServer,
        sendInDM,
      };
      await db.collection("guilds").doc(gid).set({ plugins: { farewell: p } }, { merge: true });
      await i.reply({ content: "✅ Farewell settings saved!", ephemeral: true });
    }
  } catch (err) {
    console.error(err);
    if (!i.replied) await i.reply({ content: "❌ Something went wrong", ephemeral: true });
  }
});

// --- Express Health Check ---
app.get("/", (_req, res) => res.send("Bot is alive"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`🌐 Web server on ${PORT}`));

// --- Login ---
client.login(process.env.TOKEN);
