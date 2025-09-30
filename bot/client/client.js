// client/client.js
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.GuildMember],
});

// Events
require("./events/ready")(client);
require("./events/guildMemberAdd")(client);
require("./events/guildMemberRemove")(client);
require("./commands")(client); // register slash commands & interactions

module.exports = client;
