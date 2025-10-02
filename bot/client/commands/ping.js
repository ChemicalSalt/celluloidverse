const { db } = require("../../utils/firestore");
const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check if bot is alive"),
  async execute(interaction) {
    await interaction.deferReply();
    const wsPing = interaction.client.ws.ping;

    const statusDoc = await db.collection("botStatus").doc("main").get();
    const status = statusDoc.exists ? statusDoc.data() : null;

    const embed = new EmbedBuilder()
      .setTitle("Bot Status")
      .setColor(status?.online ? 0x00ff00 : 0xff0000)
      .addFields(
        { name: "Discord Ping", value: `${wsPing}ms`, inline: false },
        { name: "Bot Online", value: status ? (status.online ? "🟢 Yes" : "🔴 No") : "❌ N/A", inline: false },
        { name: "Ping Recorded", value: status ? `${status.ping}ms` : "❌ N/A", inline: false },
        { name: "Servers", value: status ? `${status.servers}` : "❌ N/A", inline: false },
        { name: "Users", value: status ? `${status.users}` : "❌ N/A", inline: false },
        { name: "Last Update", value: status ? new Date(status.timestamp).toLocaleString() : "❌ N/A", inline: false }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
