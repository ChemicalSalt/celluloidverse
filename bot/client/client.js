const fs = require("fs");
const path = require("path");

function loadClient(client) {
  // Load events
  const eventsPath = path.join(__dirname, "events");
  fs.readdirSync(eventsPath).forEach((file) => {
    const event = require(path.join(eventsPath, file));
    client.on(event.name, (...args) => event.execute(client, ...args));
  });

  // Load commands
  client.commands = new Map();
  const commandsPath = path.join(__dirname, "commands");
  fs.readdirSync(commandsPath).forEach((file) => {
    const cmd = require(path.join(commandsPath, file));
    client.commands.set(cmd.data.name, cmd);
  });
}

module.exports = { loadClient };
