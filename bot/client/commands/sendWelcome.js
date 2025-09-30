const { SlashCommandBuilder } = require("discord.js");
const { cleanChannelId } = require("../../utils/helpers");
const { db } = require("../../utils/firestore");

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
    const gid = interaction.guildId;
    const docSnap = await db.collection("guilds").doc(gid).get();
    const plugins = docSnap.exists ? (docSnap.data()?.plugins || {}) : {};

    const channelId = cleanChannelId(interaction.options.getString("channel"));
    const serverMsg = interaction.options.getString("servermessage") || plugins.welcome?.serverMessage;
    const dmMsg = interaction.options.getString("dmmessage") || plugins.welcome?.dmMessage;
    const sendInServer = interaction.options.getBoolean("send_in_server");
    const sendInDM = interaction.options.getBoolean("send_in_dm");

    const p = { channelId, serverMessage: serverMsg, dmMessage: dmMsg, enabled: true, sendInServer, sendInDM };
    await db.collection("guilds").doc(gid).set({ plugins: { ...plugins, welcome: p } }, { merge: true });

    await interaction.reply({ content: "✅ Welcome settings saved!", ephemeral: true });
  },
};
