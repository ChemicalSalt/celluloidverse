const fs = require("fs");
const path = require("path");

function loadClient(client) {
  // Load events
  const eventsPath = path.join(__dirname, "events");
  fs.readdirSync(eventsPath).forEach((file) => {
    const event = require(path.join(eventsPath, file));
    if (!event || !event.name || !event.execute) return;
    client.on(event.name, async (...args) => {
      try {
        await event.execute(client, ...args);
      } catch (err) {
        console.error(`Error in event ${event.name}:`, err);
      }
    });
  });

  // Load commands
  client.commands = new Map();
  const commandsPath = path.join(__dirname, "commands");
  fs.readdirSync(commandsPath).forEach((file) => {
    const cmd = require(path.join(commandsPath, file));
    if (!cmd || !cmd.data || !cmd.execute) {
      console.warn(`Skipping invalid command file: ${file}`);
      return;
    }
    client.commands.set(cmd.data.name, cmd);
  });

  // Interaction handler
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (err) {
      console.error(`Error executing command ${interaction.commandName}:`, err);
      if (!interaction.replied) {
        await interaction.reply({ content: "❌ Something went wrong", ephemeral: true });
      }
    }
  });
}

module.exports = { loadClient };
