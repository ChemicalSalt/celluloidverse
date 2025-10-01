const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder().setName("ping").setDescription("Check bot alive"),
  async execute(interaction) {
    await interaction.reply({ content: "🏓 Pong!", flags: 64 });
  },
};
