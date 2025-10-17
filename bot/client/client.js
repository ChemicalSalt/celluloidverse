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
const moment = require("moment-timezone");
const commandsConfig = require("../config/botConfig").COMMANDS;
const { savePluginConfig, db } = require("../utils/firestore");
const languagePlugin = require("../plugins/language");
const { sanitizeDynamic } = require("../utils/sanitize");
const { loadAllSchedules, scheduleWordOfTheDay } = require("../cron/scheduler");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.GuildMember],
});

languagePlugin.setClient(client);

// Register Slash Commands
async function registerCommands() {
  try {
    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
    const cmds = commandsConfig.map((c) => {
      const builder = new SlashCommandBuilder()
        .setName(c.name)
        .setDescription(c.description || "");
      (c.options || []).forEach((opt) => {
        if (opt.type === 3) {
          builder.addStringOption((o) => {
            o.setName(opt.name)
              .setDescription(opt.description || "")
              .setRequired(!!opt.required);
            (opt.choices || []).forEach((ch) =>
              o.addChoices({ name: ch.name, value: ch.value })
            );
            return o;
          });
        } else if (opt.type === 5) {
          builder.addBooleanOption((o) =>
            o.setName(opt.name)
              .setDescription(opt.description || "")
              .setRequired(!!opt.required)
          );
        } else if (opt.type === 7) {
          builder.addChannelOption((o) =>
            o.setName(opt.name)
              .setDescription(opt.description || "")
              .setRequired(!!opt.required)
          );
        }
      });
      return builder.toJSON();
    });

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: cmds });
    console.log("[Discord] ✅ Registered slash commands");
  } catch (err) {
    console.error("[Discord] ❌ Command registration failed", err);
  }
}

// Load event handlers
require("./events/ready")(client);
require("./events/guildMemberAdd")(client);
require("./events/guildMemberRemove")(client);

// Handle slash commands
client.on("interactionCreate", async (i) => {
  if (!i.isCommand()) return;

  console.log(`[Debug] Interaction received: ${i.commandName}`);
  const gid = i.guildId;

  try {
    // Ping command
    if (i.commandName === "ping") {
      const statusDoc = await db.collection("botStatus").doc("main").get();
      const status = statusDoc.exists ? statusDoc.data() : null;
      const embed = new EmbedBuilder()
        .setTitle("Bot Status")
        .setColor(status?.online ? 0x00ff00 : 0xff0000)
        .addFields(
          { name: "Signal", value: status ? (status.online ? "🟢 Online" : "🔴 Offline") : "❌ N/A" },
          { name: "Ping", value: status ? `${status.ping}ms` : "❌ N/A" },
          { name: "Servers", value: status ? `${status.servers}` : "❌ N/A" },
          { name: "Last Update", value: status ? new Date(status.timestamp).toLocaleString() : "❌ N/A" }
        )
        .setTimestamp();
      return i.reply({ embeds: [embed] });
    }

    // Dashboard command
    if (i.commandName === "dashboard") {
      return i.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("➡ Open Dashboard")
            .setDescription("Click below to access your dashboard")
            .setURL(process.env.DASHBOARD_URL || "https://example.com")
            .setColor(0x00ff00),
        ],
      });
    }

    // Word of the Day setup
    if (i.commandName === "send_language") {
      const channel = i.options.getChannel("channel");
      const time = i.options.getString("time");
      const timezone = i.options.getString("timezone");
      const language = i.options.getString("language") || "japanese";

      if (!moment.tz.zone(timezone)) {
        return i.reply({ content: `❌ Invalid timezone: \`${timezone}\`` });
      }

      if (!/^\d{2}:\d{2}$/.test(time)) {
        return i.reply({ content: "❌ Invalid time format. Use HH:MM (24-hour)." });
      }

      const utcTime = moment.tz(time, "HH:mm", timezone).utc().format("HH:mm");

      const pluginData = {
        enabled: true,
        channelId: channel.id,
        timezone,
        time,
        utcTime,
        updatedAt: new Date().toISOString(),
      };

      // Save in unified Firestore structure
      await db
        .collection("guilds")
        .doc(gid)
        .set({ plugins: { language: { [language]: pluginData } } }, { merge: true });

      // Schedule job
      scheduleWordOfTheDay(gid, pluginData, language);

      return i.reply({
        content: `✅ Word of the Day scheduled for **${language}** at **${time} (${timezone})** → ${channel}`,
      });
    }

    // Welcome
    if (i.commandName === "send_welcome") {
      const channel = i.options.getChannel("channel");
      const serverMsg = sanitizeDynamic(i.options.getString("server_message") || "");
      const dmMsg = sanitizeDynamic(i.options.getString("dm_message") || "");
      const sendInServer = i.options.getBoolean("send_in_server");
      const sendInDM = i.options.getBoolean("send_in_dm");

      const p = {
        channelId: channel.id,
        serverMessage: serverMsg,
        dmMessage: dmMsg,
        enabled: true,
        sendInServer,
        sendInDM,
        updatedAt: new Date().toISOString(),
      };

      await db.collection("guilds").doc(gid).set({ plugins: { welcome: p } }, { merge: true });
      return i.reply({ content: `✅ Welcome settings saved for ${channel}` });
    }

    // Farewell
    if (i.commandName === "send_farewell") {
      const channel = i.options.getChannel("channel");
      const serverMsg = sanitizeDynamic(i.options.getString("server_message") || "");
      const dmMsg = sanitizeDynamic(i.options.getString("dm_message") || "");
      const sendInServer = i.options.getBoolean("send_in_server");
      const sendInDM = i.options.getBoolean("send_in_dm");

      const p = {
        channelId: channel.id,
        serverMessage: serverMsg,
        dmMessage: dmMsg,
        enabled: true,
        sendInServer,
        sendInDM,
        updatedAt: new Date().toISOString(),
      };

      await db.collection("guilds").doc(gid).set({ plugins: { farewell: p } }, { merge: true });
      return i.reply({ content: `✅ Farewell settings saved for ${channel}` });
    }
  } catch (err) {
    console.error("[interactionCreate] error:", err);
    try {
      if (!i.replied && !i.deferred)
        await i.reply({ content: "❌ Something went wrong." });
    } catch {}
  }
});

async function start() {
  if (!process.env.TOKEN || !process.env.CLIENT_ID) {
    console.error("TOKEN or CLIENT_ID missing!");
    process.exit(1);
  }

  await registerCommands();
  await client.login(process.env.TOKEN);
  await loadAllSchedules();
  console.log("[Scheduler] 🔁 All jobs loaded from Firestore");
}

module.exports = { client, start };
