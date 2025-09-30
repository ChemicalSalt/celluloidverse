const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("../../config/botConfig");

const commands = [];
const commandFiles = fs.readdirSync(__dirname).filter(file => file !== "registerCommands.js" && file.endsWith(".js"));

const commandsMap = new Map();

for (const file of commandFiles) {
  const command = require(path.join(__dirname, file));
  commands.push(command.data.toJSON());
  commandsMap.set(command.data.name, command);
}

const rest = new REST({ version: "10" }).setToken(config.TOKEN);

async function registerCommands(client) {
  try {
    await rest.put(Routes.applicationCommands(config.CLIENT_ID), { body: commands });
    console.log("✅ Slash commands registered");

    client.on("interactionCreate", async (interaction) => {
      if (!interaction.isCommand()) return;

      const command = commandsMap.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error("🔥 Command execution error:", error);
        if (!interaction.replied) {
          await interaction.reply({ content: "❌ Something went wrong", ephemeral: true });
        }
      }
    });
  } catch (error) {
    console.error("🔥 Slash registration error:", error);
  }
}

module.exports = { registerCommands };
