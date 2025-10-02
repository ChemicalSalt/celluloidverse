const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dashboard")
    .setDescription("Open the backend dashboard"),

  async execute(interaction) {
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.deferReply({ ephemeral: true }); // acknowledge quickly
      }

      const embed = new EmbedBuilder()
        .setTitle("➡ Open Dashboard")
        .setDescription("Click the link below to access the backend dashboard")
        .setURL(process.env.DASHBOARD_URL || "https://example.com")
        .setColor(0x3498db);

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error("[/dashboard] error:", err);
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: "❌ Something went wrong.", ephemeral: true });
        }
      } catch {}
    }
  },
};
