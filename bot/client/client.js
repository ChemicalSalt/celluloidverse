// client/client.js
const { Client, GatewayIntentBits, Partials, REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

const { CLIENT_ID, TOKEN } = require("../config/botConfig");

function buildClient() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.GuildMember],
  });

  // Attach a command collection for runtime use
  client.commands = new Map();

  // load command modules into memory (for execution at runtime)
  const commandsPath = path.join(__dirname, "commands");
  for (const file of fs.readdirSync(commandsPath)) {
    if (!file.endsWith(".js")) continue;
    const cmd = require(path.join(commandsPath, file));
    if (!cmd || !cmd.data || !cmd.execute) {
      console.warn(`⚠ Invalid command file: ${file}`);
      continue;
    }
    client.commands.set(cmd.data.name, cmd);
  }

  return client;
}

// register commands with Discord via REST (full set from client/commands)
async function registerCommands() {
  const commandsDir = path.join(__dirname, "commands");
  const commands = [];
  for (const f of fs.readdirSync(commandsDir)) {
    if (!f.endsWith(".js")) continue;
    const mod = require(path.join(commandsDir, f));
    if (mod && mod.data) commands.push(mod.data.toJSON());
  }

  if (!TOKEN || !CLIENT_ID) {
    throw new Error("CLIENT_ID or TOKEN missing in env");
  }

  const rest = new REST({ version: "10" }).setToken(TOKEN);
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
}

module.exports = {
  buildClient,
  registerCommands,
};
