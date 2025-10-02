require("dotenv").config();
const { Client, GatewayIntentBits, Partials, REST, Routes } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const helpers = require("../utils/helpers");
const { savePluginConfig } = require("../utils/firestore");
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

// ---------- Load commands ----------
client.commands = new Map();
const commandsPath = path.join(__dirname, "../commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

const commandsJson = [];
for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    commandsJson.push(command.data.toJSON());
  }
}

// ---------- Register slash commands ----------
async function registerCommands() {
  try {
    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commandsJson });
    console.log("[Discord] Registered slash commands");
  } catch (err) {
    console.error("[Discord] Command registration failed", err);
  }
}

// ---------- Events ----------
const readyEvent = require("./events/ready");
const guildMemberAddEvent = require("./events/guildMemberAdd");
const guildMemberRemoveEvent = require("./events/guildMemberRemove");

readyEvent(client);
guildMemberAddEvent(client);
guildMemberRemoveEvent(client);

// ---------- Interaction handler ----------
client.on("interactionCreate", async (i) => {
  if (!i.isCommand()) return;

  const command = client.commands.get(i.commandName);
  if (!command) return;

  try {
    await command.execute(i);
  } catch (err) {
    console.error(`[interactionCreate] Error in command ${i.commandName}:`, err);
    if (!i.replied) {
      await i.reply({ content: "❌ Something went wrong.", ephemeral: true });
    }
  }
});

// ---------- Start ----------
async function start() {
  if (!process.env.TOKEN || !process.env.CLIENT_ID) {
    console.error("TOKEN or CLIENT_ID missing!");
    process.exit(1);
  }
  await registerCommands();
  await client.login(process.env.TOKEN);
}

module.exports = { client, start };
