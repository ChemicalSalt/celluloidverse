// client/commands/dashboard.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { DASHBOARD_URL } = require("../../config/botConfig");

module.exports = {
  data: new SlashCommandBuilder().setName("dashboard").setDescription("Open dashboard"),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("➡ Open Dashboard")
      .setDescription("Click to access backend dashboard")
      .setURL(DASHBOARD_URL)
      .setColor(0x00ff00);

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
