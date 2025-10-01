const { SlashCommandBuilder } = require("discord.js");
const { cleanChannelId } = require("../../utils/helpers");
const { setGuildDoc } = require("../../utils/firestore");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sendwelcome")
    .setDescription("Setup Welcome message")
    .addStringOption((o) => o.setName("channel").setDescription("Channel ID or #channel").setRequired(true))
    .addBooleanOption((o) => o.setName("send_in_server").setDescription("Send in server?").setRequired(true))
    .addBooleanOption((o) => o.setName("send_in_dm").setDescription("Send in DM?").setRequired(true))
    .addStringOption((o) => o.setName("servermessage").setDescription("Server message").setRequired(false))
    .addStringOption((o) => o.setName("dmmessage").setDescription("DM message").setRequired(false)),
  async execute(interaction) {
    const db = interaction.client.db;
    const gid = interaction.guildId;
    const pluginsDoc = (await db.collection("guilds").doc(gid).get()).data()?.plugins || {};

    const channelId = cleanChannelId(interaction.options.getString("channel"));
    const serverMessage = interaction.options.getString("servermessage");
    const dmMessage = interaction.options.getString("dmmessage");
    const sendInServer = interaction.options.getBoolean("send_in_server");
    const sendInDM = interaction.options.getBoolean("send_in_dm");

    const plugin = { channelId, serverMessage, dmMessage, enabled: true, sendInServer, sendInDM };

    await setGuildDoc(db, gid, { plugins: { ...pluginsDoc, welcome: plugin } });
    await interaction.reply({ content: "✅ Welcome settings saved!", ephemeral: true });
  },
};
