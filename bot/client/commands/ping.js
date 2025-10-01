// client/commands/ping.js
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder().setName("ping").setDescription("Check bot alive"),
  async execute(interaction) {
    return interaction.reply({ content: "🏓 Pong!", ephemeral: true });
  },
};
