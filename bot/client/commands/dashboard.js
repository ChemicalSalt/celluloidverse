const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
module.exports = {
  data: new SlashCommandBuilder().setName("dashboard").setDescription("Open dashboard"),
  async execute(client, interaction) {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("➡ Open Dashboard")
          .setDescription("Click to access backend dashboard")
          .setURL(process.env.DASHBOARD_URL)
          .setColor(0x00ff00),
      ],
      ephemeral: true,
    });
  },
};
