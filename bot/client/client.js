require("dotenv").config();
const { Client, GatewayIntentBits, Partials, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const helpers = require("../utils/helpers");
const commandsConfig = require("../config/botConfig").COMMANDS;
const { savePluginConfig, db } = require("../utils/firestore"); // add db import
const languagePlugin = require("../plugins/language");

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

// Register slash commands
async function registerCommands() {
  try {
    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

    const cmds = commandsConfig.map((c) => {
      const builder = new SlashCommandBuilder()
        .setName(c.name)
        .setDescription(c.description || "");

      (c.options || []).forEach((opt) => {
        // STRING
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
        }

        // BOOLEAN
        if (opt.type === 5) {
          builder.addBooleanOption((o) =>
            o.setName(opt.name)
              .setDescription(opt.description || "")
              .setRequired(!!opt.required)
          );
        }

        // CHANNEL
        if (opt.type === 7) {
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


// Events
const readyEvent = require("./events/ready");
const guildMemberAddEvent = require("./events/guildMemberAdd");
const guildMemberRemoveEvent = require("./events/guildMemberRemove");

readyEvent(client);
guildMemberAddEvent(client);
guildMemberRemoveEvent(client);

// Slash interactions
client.on("interactionCreate", async (i) => {
  if (!i.isCommand()) return;
  const gid = i.guildId;

  try {
    // -------- PING (Firestore Embed) --------
    if (i.commandName === "ping") {
      await i.deferReply();
      const wsPing = i.client.ws.ping;

      const statusDoc = await db.collection("botStatus").doc("main").get();
      const status = statusDoc.exists ? statusDoc.data() : null;

      const embed = new EmbedBuilder()
        .setTitle("Bot Status")
        .setColor(status?.online ? 0x00ff00 : 0xff0000)
        .addFields(
          { name: "Signal", value: status ? (status.online ? "🟢 Online" : "🔴 Offline") : "❌ N/A", inline: false },
          { name: "Ping", value: status ? `${status.ping}ms` : "❌ N/A", inline: false },
          { name: "Servers", value: status ? `${status.servers}` : "❌ N/A", inline: false },
          { name: "Last Update", value: status ? new Date(status.timestamp).toLocaleString() : "❌ N/A", inline: false }
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
        ephemeral: true,
      });
    }

    // -------- LANGUAGE / WOTD --------
    if (i.commandName === "sendlanguage") {
      const channel = i.options.getChannel("channel");
      const time = i.options.getString("time");
      const language = i.options.getString("language") || "japanese";

      const p = { channelId: channel.id, time, timezone: "UTC", language, enabled: true };
      await savePluginConfig(gid, "language", p);

      return i.reply({ content: `✅ WOTD saved. Runs daily at ${time} UTC in ${channel}.`, ephemeral: true });
    }

    // -------- WELCOME --------
    if (i.commandName === "sendwelcome") {
      const channel = i.options.getChannel("channel");
      const serverMsg = i.options.getString("server_message") || null;
      const dmMsg = i.options.getString("dm_message") || null;
      const sendInServer = i.options.getBoolean("send_in_server");
      const sendInDM = i.options.getBoolean("send_in_dm");

      const p = { channelId: channel.id, serverMessage: serverMsg, dmMessage: dmMsg, enabled: true, sendInServer, sendInDM };
      await savePluginConfig(gid, "welcome", p);

      return i.reply({ content: `✅ Welcome settings saved for ${channel}.`, ephemeral: true });
    }

    // -------- FAREWELL --------
    if (i.commandName === "sendfarewell") {
      const channel = i.options.getChannel("channel");
      const serverMsg = i.options.getString("server_message") || null;
      const dmMsg = i.options.getString("dm_message") || null;
      const sendInServer = i.options.getBoolean("send_in_server");
      const sendInDM = i.options.getBoolean("send_in_dm");

      const p = { channelId: channel.id, serverMessage: serverMsg, dmMessage: dmMsg, enabled: true, sendInServer, sendInDM };
      await savePluginConfig(gid, "farewell", p);

      return i.reply({ content: `✅ Farewell settings saved for ${channel}.`, ephemeral: true });
    }
  } catch (err) {
    console.error("[interactionCreate] error:", err);
    if (!i.replied) {
      try {
        await i.reply({ content: "❌ Something went wrong.", ephemeral: true });
      } catch {}
    }
  }
});


async function start() {
  if (!process.env.TOKEN || !process.env.CLIENT_ID) {
    console.error("TOKEN or CLIENT_ID missing!");
    process.exit(1);
  }
  await registerCommands();
  await client.login(process.env.TOKEN);
}

module.exports = { client, start };
