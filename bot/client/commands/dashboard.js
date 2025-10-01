const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder().setName("dashboard").setDescription("Open dashboard"),
  async execute(interaction) {
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("➡ Open Dashboard")
              .setDescription("Click to access backend dashboard")
              .setURL(process.env.DASHBOARD_URL)
              .setColor(0x00ff00),
          ],
          flags: 64,
        });
      } else {
        await interaction.followUp({
          embeds: [
            new EmbedBuilder()
              .setTitle("➡ Open Dashboard")
              .setDescription("Click to access backend dashboard")
              .setURL(process.env.DASHBOARD_URL)
              .setColor(0x00ff00),
          ],
          flags: 64,
        });
      }
    } catch (err) {
      console.error("Dashboard command error:", err);
    }
  },
};
