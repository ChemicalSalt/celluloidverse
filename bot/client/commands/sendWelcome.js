const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sendWelcome")
    .setDescription("Setup Welcome message")
    .addChannelOption(opt => opt.setName("channel").setDescription("Channel").setRequired(true))
    .addBooleanOption(opt => opt.setName("send_in_server").setDescription("Send in server?").setRequired(true))
    .addBooleanOption(opt => opt.setName("send_in_dm").setDescription("Send in DM?").setRequired(true))
    .addStringOption(opt => opt.setName("server_message").setDescription("Server message"))
    .addStringOption(opt => opt.setName("dm_message").setDescription("DM message")),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const channel = interaction.options.getChannel("channel");
      await interaction.editReply(`✅ Welcome config saved for ${channel}.`);
    } catch (err) {
      console.error("[/sendWelcome] error:", err);
    }
  },
};
