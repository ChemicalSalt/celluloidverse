const fs = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");

module.exports = async (client) => {
  client.commands = new Map();

  // --- Load commands dynamically ---
  const commandsPath = path.join(__dirname, "commands");
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

  const commandsForDiscord = [];

  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (!command.data || !command.execute) continue;

    client.commands.set(command.data.name, command);
    commandsForDiscord.push(command.data.toJSON());
  }

  // --- Register slash commands globally ---
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  (async () => {
    try {
      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commandsForDiscord });
      console.log("✅ Slash commands registered");
    } catch (err) {
      console.error("🔥 Slash registration error:", err);
    }
  })();

  // --- Load events dynamically ---
  const eventsPath = path.join(__dirname, "events");
  const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith(".js"));

  for (const file of eventFiles) {
    const eventHandler = require(path.join(eventsPath, file));
    const eventName = file.replace(".js", "");

    if (eventName === "ready") {
      client.once("ready", () => eventHandler(client));
    } else if (eventName === "guildMemberAdd") {
      client.on("guildMemberAdd", (member) => eventHandler(member));
    } else if (eventName === "guildMemberRemove") {
      client.on("guildMemberRemove", (member) => eventHandler(member));
    }
  }

  // --- Interaction handler ---
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error("🔥 Interaction handler error:", err);
      if (!interaction.replied) {
        await interaction.reply({ content: "❌ Something went wrong", ephemeral: true });
      }
    }
  });
};
