// client/client.js
require("dotenv").config();
const { Client, GatewayIntentBits, Partials, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const commandsConfig = require("../config/botConfig").COMMANDS;
const helpers = require("../utils/helpers");

// create client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.GuildMember],
});

// Register slash commands
async function registerCommands() {
  try {
    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
    const cmds = commandsConfig.map((c) => {
      const builder = new SlashCommandBuilder().setName(c.name).setDescription(c.description || "no description");
      if (Array.isArray(c.options)) {
        c.options.forEach((opt) => {
          if (opt.type === 3) {
            builder.addStringOption((o) => {
              o.setName(opt.name).setDescription(opt.description || "").setRequired(!!opt.required);
              if (Array.isArray(opt.choices)) {
                opt.choices.forEach((ch) => o.addChoices({ name: ch.name, value: ch.value }));
              }
              return o;
            });
          }
          if (opt.type === 5) {
            builder.addBooleanOption((o) => o.setName(opt.name).setDescription(opt.description || "").setRequired(!!opt.required));
          }
        });
      }
      return builder.toJSON();
    });

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: cmds });
    console.log("[Discord] Registered slash commands");
  } catch (err) {
    console.error("[Discord] command registration failed", err);
  }
}

// Load event modules (client/events/*)
const readyEvent = require("./events/ready");
const guildMemberAddEvent = require("./events/guildMemberAdd");
const guildMemberRemoveEvent = require("./events/guildMemberRemove");

// initialize events with client
readyEvent(client);
guildMemberAddEvent(client);
guildMemberRemoveEvent(client);

// Interaction handler (slash commands)
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const gid = interaction.guildId;
  const name = interaction.commandName;

  try {
    if (name === "ping") {
      await interaction.reply("🏓 Pong!");
      return;
    }

    if (name === "dashboard") {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("➡ Open Dashboard")
            .setDescription("Click to access backend dashboard")
            .setURL(process.env.DASHBOARD_URL || "https://example.com")
            .setColor(0x00ff00),
        ],
      });
      return;
    }

    if (name === "sendwotd") {
      const rawChannel = interaction.options.getString("channel");
      const channelId = helpers.cleanChannelId(rawChannel);
      const time = interaction.options.getString("time");
      const language = interaction.options.getString("language") || "japanese";

      const p = {
        channelId,
        time,
        timezone: "UTC",
        language,
        enabled: true,
      };

      const { savePluginConfig } = require("../utils/firestore");
      await savePluginConfig(gid, "language", p);
      await savePluginConfig(gid, "wotd", p);

      // schedule is handled by the Firestore watcher in ready event
      await interaction.reply(`✅ WOTD saved. Runs daily at ${time} UTC.`);
      return;
    }

    if (name === "sendwelcome") {
      const rawChannel = interaction.options.getString("channel");
      const channelId = helpers.cleanChannelId(rawChannel);
      const serverMsg = interaction.options.getString("servermessage") || null;
      const dmMsg = interaction.options.getString("dmmessage") || null;
      const sendInServer = !!interaction.options.getBoolean("send_in_server");
      const sendInDM = !!interaction.options.getBoolean("send_in_dm");

      const p = {
        channelId,
        serverMessage: serverMsg,
        dmMessage: dmMsg,
        enabled: true,
        sendInServer,
        sendInDM,
      };

      const { savePluginConfig } = require("../utils/firestore");
      await savePluginConfig(gid, "welcome", p);

      await interaction.reply("✅ Welcome settings saved!");
      return;
    }

    if (name === "sendfarewell") {
      const rawChannel = interaction.options.getString("channel");
      const channelId = helpers.cleanChannelId(rawChannel);
      const serverMsg = interaction.options.getString("servermessage") || null;
      const dmMsg = interaction.options.getString("dmmessage") || null;
      const sendInServer = !!interaction.options.getBoolean("send_in_server");
      const sendInDM = !!interaction.options.getBoolean("send_in_dm");

      const p = {
        channelId,
        serverMessage: serverMsg,
        dmMessage: dmMsg,
        enabled: true,
        sendInServer,
        sendInDM,
      };

      const { savePluginConfig } = require("../utils/firestore");
      await savePluginConfig(gid, "farewell", p);

      await interaction.reply("✅ Farewell settings saved!");
      return;
    }
  } catch (err) {
    console.error("[interactionCreate] error:", err);
    try {
      if (!interaction.replied) await interaction.reply("❌ Something went wrong.");
    } catch {}
  }
});

async function start() {
  if (!process.env.TOKEN) {
    console.error("TOKEN env missing!");
    process.exit(1);
  }
  if (!process.env.CLIENT_ID) {
    console.error("CLIENT_ID env missing!");
    process.exit(1);
  }

  await registerCommands();
  await client.login(process.env.TOKEN);
}

module.exports = { client, start };
