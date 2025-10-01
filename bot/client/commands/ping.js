const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder().setName("ping").setDescription("Check bot alive"),
  async execute(interaction) {
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "🏓 Pong!", flags: 64 });
      } else {
        await interaction.followUp({ content: "🏓 Pong!", flags: 64 });
      }
    } catch (err) {
      console.error("Ping command error:", err);
    }
  },
};
