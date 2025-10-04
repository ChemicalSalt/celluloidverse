const { SlashCommandBuilder, ChannelType } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sendFarewell")
    .setDescription("Setup Farewell message")
    .addChannelOption(opt =>
      opt.setName("channel")
         .setDescription("Channel")
         .setRequired(true)
         .addChannelTypes(ChannelType.GuildText) // only text channels
    )
    .addBooleanOption(opt => opt.setName("send_in_server").setDescription("Send in server?").setRequired(true))
    .addBooleanOption(opt => opt.setName("send_in_dm").setDescription("Send in DM?").setRequired(true))
    .addStringOption(opt => opt.setName("server_message").setDescription("Server message"))
    .addStringOption(opt => opt.setName("dm_message").setDescription("DM message")),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const channel = interaction.options.getChannel("channel");
      await interaction.editReply(`✅ Farewell config saved for ${channel}.`);
    } catch (err) {
      console.error("[/sendFarewell] error:", err);
    }
  },
};
