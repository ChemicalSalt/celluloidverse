const { SlashCommandBuilder } = require("discord.js");
const { db } = require("../../utils/firestore");

function cleanChannelId(id) {
  if (!id) return null;
  return id.replace(/[^0-9]/g, "");
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sendwelcome")
    .setDescription("Setup Welcome message")
    .addStringOption((option) =>
      option.setName("channel").setDescription("Channel ID or #channel").setRequired(true)
    )
    .addBooleanOption((option) =>
      option.setName("send_in_server").setDescription("Send in server?").setRequired(true)
    )
    .addBooleanOption((option) =>
      option.setName("send_in_dm").setDescription("Send in DM?").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("servermessage").setDescription("Server message").setRequired(false)
    )
    .addStringOption((option) =>
      option.setName("dmmessage").setDescription("DM message").setRequired(false)
    ),
  async execute(interaction) {
    const guildId = interaction.guildId;
    const channelId = cleanChannelId(interaction.options.getString("channel"));
    const serverMessage = interaction.options.getString("servermessage");
    const dmMessage = interaction.options.getString("dmmessage");
    const sendInServer = interaction.options.getBoolean("send_in_server");
    const sendInDM = interaction.options.getBoolean("send_in_dm");

    const docRef = db.collection("guilds").doc(guildId);
    const doc = await docRef.get();
    const plugins = doc.exists ? doc.data().plugins || {} : {};

    const welcomeData = {
      channelId,
      serverMessage,
      dmMessage,
      enabled: true,
      sendInServer,
      sendInDM,
    };

    await docRef.set(
      { plugins: { ...plugins, welcome: welcomeData } },
      { merge: true }
    );

    await interaction.reply({ content: "✅ Welcome settings saved!", ephemeral: true });
  },
};
