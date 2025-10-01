// client/client.js
require("dotenv").config();
const { Client, GatewayIntentBits, Partials, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const helpers = require("../utils/helpers");
const commandsConfig = require("../config/botConfig").COMMANDS;
const { savePluginConfig } = require("../utils/firestore");

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
      const builder = new SlashCommandBuilder().setName(c.name).setDescription(c.description || "");
      (c.options || []).forEach((opt) => {
        if (opt.type === 3) { // string
          builder.addStringOption((o) => {
            o.setName(opt.name).setDescription(opt.description || "").setRequired(!!opt.required);
            (opt.choices || []).forEach(ch => o.addChoices({ name: ch.name, value: ch.value }));
            return o;
          });
        }
        if (opt.type === 5) { // boolean
          builder.addBooleanOption((o) => o.setName(opt.name).setDescription(opt.description || "").setRequired(!!opt.required));
        }
      });
      return builder.toJSON();
    });
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: cmds });
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
    if (i.commandName === "ping") return i.reply("🏓 Pong!");

    if (i.commandName === "dashboard") {
      return i.reply({ embeds: [new EmbedBuilder()
        .setTitle("➡ Open Dashboard")
        .setDescription("Click to access backend dashboard")
        .setURL(process.env.DASHBOARD_URL || "https://example.com")
        .setColor(0x00ff00)
      ]});
    }

    if (i.commandName === "sendwotd") {
      const channelId = helpers.cleanChannelId(i.options.getString("channel"));
      const time = i.options.getString("time");
      const language = i.options.getString("language") || "japanese";

      const p = { channelId, time, timezone: "UTC", language, enabled: true };
      await savePluginConfig(gid, "language", p);

      return i.reply(`✅ WOTD saved. Runs daily at ${time} UTC.`);
    }

    // Welcome
    if (i.commandName === "sendwelcome") {
      const channelId = helpers.cleanChannelId(i.options.getString("channel"));
      const serverMsg = i.options.getString("servermessage") || null;
      const dmMsg = i.options.getString("dmmessage") || null;
      const sendInServer = !!i.options.getBoolean("send_in_server");
      const sendInDM = !!i.options.getBoolean("send_in_dm");

      const p = { channelId, serverMessage: serverMsg, dmMessage: dmMsg, enabled: true, sendInServer, sendInDM };
      await savePluginConfig(gid, "welcome", p);
      return i.reply("✅ Welcome settings saved!");
    }

    // Farewell
    if (i.commandName === "sendfarewell") {
      const channelId = helpers.cleanChannelId(i.options.getString("channel"));
      const serverMsg = i.options.getString("servermessage") || null;
      const dmMsg = i.options.getString("dmmessage") || null;
      const sendInServer = !!i.options.getBoolean("send_in_server");
      const sendInDM = !!i.options.getBoolean("send_in_dm");

      const p = { channelId, serverMessage: serverMsg, dmMessage: dmMsg, enabled: true, sendInServer, sendInDM };
      await savePluginConfig(gid, "farewell", p);
      return i.reply("✅ Farewell settings saved!");
    }
  } catch (err) {
    console.error("[interactionCreate] error:", err);
    if (!i.replied) try { await i.reply("❌ Something went wrong."); } catch {}
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
