// client/commands/sendFarewell.js
const { SlashCommandBuilder } = require("discord.js");
const { cleanChannelId } = require("../../utils/helpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sendfarewell")
    .setDescription("Setup Farewell message")
    .addStringOption((o) => o.setName("channel").setDescription("Channel ID or #channel").setRequired(true))
    .addBooleanOption((o) => o.setName("send_in_server").setDescription("Send in server?").setRequired(true))
    .addBooleanOption((o) => o.setName("send_in_dm").setDescription("Send in DM?").setRequired(true))
    .addStringOption((o) => o.setName("servermessage").setDescription("Server message").setRequired(false))
    .addStringOption((o) => o.setName("dmmessage").setDescription("DM message").setRequired(false)),
  async execute(interaction) {
    try {
      const db = interaction.client.db;
      const channelId = cleanChannelId(interaction.options.getString("channel"));
      const serverMsg = interaction.options.getString("servermessage") || undefined;
      const dmMsg = interaction.options.getString("dmmessage") || undefined;
      const sendInServer = interaction.options.getBoolean("send_in_server");
      const sendInDM = interaction.options.getBoolean("send_in_dm");

      const p = { channelId, serverMessage: serverMsg, dmMessage: dmMsg, enabled: true, sendInServer, sendInDM };
      const docRef = db.collection("guilds").doc(interaction.guildId);
      const doc = await docRef.get();
      const plugins = doc.exists ? (doc.data()?.plugins || {}) : {};
      await docRef.set({ plugins: { ...plugins, farewell: p } }, { merge: true });

      return interaction.reply({ content: "✅ Farewell settings saved!", ephemeral: true });
    } catch (err) {
      console.error("🔥 sendfarewell command error:", err);
      return interaction.reply({ content: "❌ Could not save farewell settings.", ephemeral: true });
    }
  },
};
