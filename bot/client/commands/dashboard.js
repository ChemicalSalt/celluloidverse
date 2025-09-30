const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require("../../config/botConfig");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dashboard")
    .setDescription("Open dashboard"),
  async execute(interaction) {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("➡ Open Dashboard")
          .setDescription("Click to access backend dashboard")
          .setURL(config.DASHBOARD_URL)
          .setColor(0x00ff00),
      ],
      ephemeral: true,
    });
  },
};
