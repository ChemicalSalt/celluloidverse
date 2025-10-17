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

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.GuildMember],
});

// Set client in language plugin
languagePlugin.setClient(client);
require("../cron/scheduler");
// Register slash commands
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

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: cmds,
    });
    console.log("[Discord] Registered slash commands");
  } catch (err) {
    console.error("[Discord] command registration failed", err);
  }
}

// Load events
require("./events/ready")(client);
require("./events/guildMemberAdd")(client);
require("./events/guildMemberRemove")(client);

// Safe interaction handler
client.on("interactionCreate", async (i) => {
  if (!i.isCommand()) return;

  console.log(
    `[Debug] Interaction received: ${i.commandName} | Replied: ${i.replied} | Deferred: ${i.deferred}`
  );

  try {
    const gid = i.guildId;

    async function safeDefer() {
      if (!i.replied && !i.deferred) {
        await i.deferReply();
        console.log(`[Debug] Deferred reply for ${i.commandName}`);
      }
    }

    // -------- PING --------
    if (i.commandName === "ping") {
      await safeDefer();

      const statusDoc = await db.collection("botStatus").doc("main").get();
      const status = statusDoc.exists ? statusDoc.data() : null;

      const embed = new EmbedBuilder()
        .setTitle("Bot Status")
        .setColor(status?.online ? 0x00ff00 : 0xff0000)
        .addFields(
          {
            name: "Signal",
            value: status
              ? status.online
                ? "🟢 Online"
                : "🔴 Offline"
              : "❌ N/A",
            inline: false,
          },
          {
            name: "Ping",
            value: status ? `${status.ping}ms` : "❌ N/A",
            inline: false,
          },
          {
            name: "Servers",
            value: status ? `${status.servers}` : "❌ N/A",
            inline: false,
          },
          {
            name: "Last Update",
            value: status
              ? new Date(status.timestamp).toLocaleString()
              : "❌ N/A",
            inline: false,
          }
        )
        .setTimestamp();

      return i.editReply({ embeds: [embed] });
    }

    // -------- DASHBOARD --------
    if (i.commandName === "dashboard") {
      return i.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("➡ Open Dashboard")
            .setDescription("Click to access backend dashboard")
            .setURL(process.env.DASHBOARD_URL || "https://example.com")
            .setColor(0x00ff00),
        ],
      });
    }

    // -------- LANGUAGE --------
   // -------- LANGUAGE --------
if (i.commandName === "send_language") {
  const channel = i.options.getChannel("channel");
  const time = i.options.getString("time");
  const timezone = i.options.getString("timezone");
  const language = i.options.getString("language") || "japanese";

  // Validate timezone
  if (!moment.tz.zone(timezone)) {
    return i.reply({
      content: `❌ Invalid timezone: \`${timezone}\``,
      ephemeral: true,
    });
  }

  // Validate time format
  if (!/^\d{2}:\d{2}$/.test(time)) {
    return i.reply({
      content: "❌ Invalid time format. Use HH:MM (24-hour format).",
      ephemeral: true,
    });
  }

  // Convert local time → UTC
  const utcTime = moment.tz(time, "HH:mm", timezone).utc().format("HH:mm");

  // Plugin object in correct format for scheduler
  const pluginData = {
    enabled: true,
    channelId: channel.id,
    timezone,
    localTime: time,
    utcTime,
    updatedAt: new Date().toISOString(),
  };

  // Save to Firestore
  await savePluginConfig(i.guildId, "language", { [language]: pluginData });

  // ✅ Schedule immediately
  const { scheduleWordOfTheDay } = require("../cron/scheduler");
  scheduleWordOfTheDay(i.guildId, { [language]: pluginData }, language);

  return i.reply({
    content: `✅ Word of the Day scheduled at **${time} (${timezone})** in ${channel} for **${language}**.`,
  });
}


    // -------- WELCOME --------
    if (i.commandName === "send_welcome") {
      await safeDefer();

      const channel = i.options.getChannel("channel");
      const serverMsg = sanitizeDynamic(
        i.options.getString("server_message") || null
      );
      const dmMsg = sanitizeDynamic(i.options.getString("dm_message") || null);

      const sendInServer = i.options.getBoolean("send_in_server");
      const sendInDM = i.options.getBoolean("send_in_dm");

      const p = {
        channelId: channel.id,
        serverMessage: serverMsg,
        dmMessage: dmMsg,
        enabled: true,
        sendInServer,
        sendInDM,
      };
      await savePluginConfig(gid, "welcome", p);

      return i.editReply({ content: `✅ Welcome settings saved for ${channel}.` });
    }

    // -------- FAREWELL --------
    if (i.commandName === "send_farewell") {
      await safeDefer();

      const channel = i.options.getChannel("channel");
      const serverMsg = sanitizeDynamic(
        i.options.getString("server_message") || null
      );
      const dmMsg = sanitizeDynamic(i.options.getString("dm_message") || null);

      const sendInServer = i.options.getBoolean("send_in_server");
      const sendInDM = i.options.getBoolean("send_in_dm");

      const p = {
        channelId: channel.id,
        serverMessage: serverMsg,
        dmMessage: dmMsg,
        enabled: true,
        sendInServer,
        sendInDM,
      };
      await savePluginConfig(gid, "farewell", p);

      return i.editReply({ content: `✅ Farewell settings saved for ${channel}.` });
    }
  } catch (err) {
    console.error("[interactionCreate] error:", err);
    try {
      if (!i.replied && !i.deferred) {
        await i.reply({ content: "❌ Something went wrong." });
      }
    } catch {}
  }
});

// Start bot
async function start() {
  if (!process.env.TOKEN || !process.env.CLIENT_ID) {
    console.error("TOKEN or CLIENT_ID missing!");
    process.exit(1);
  }
  await registerCommands();
  await client.login(process.env.TOKEN);
}

module.exports = { client, start };
