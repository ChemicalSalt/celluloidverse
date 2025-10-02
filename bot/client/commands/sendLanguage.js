const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sendLanguage")
    .setDescription("Setup Word of the Day")
    .addChannelOption(opt => opt.setName("channel").setDescription("Channel").setRequired(true))
    .addStringOption(opt => opt.setName("time").setDescription("HH:MM UTC").setRequired(true))
    .addStringOption(opt => opt.setName("language").setDescription("Pick language").setRequired(true)
      .addChoices({ name: "Japanese", value: "japanese" })),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const channel = interaction.options.getChannel("channel");
      await interaction.editReply(`✅ WOTD configured for ${channel}.`);
    } catch (err) {
      console.error("[/sendLanguage] error:", err);
    }
  },
};
