const { SlashCommandBuilder } = require("discord.js");
module.exports = {
  data: new SlashCommandBuilder().setName("ping").setDescription("Check bot alive"),
  async execute(client, interaction) {
    await interaction.reply("🏓 Pong!");
  },
};
