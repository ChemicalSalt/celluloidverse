const { db } = require("../../utils/firestore");
const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check bot alive and Firestore live status"),
  async execute(interaction) {
    await interaction.deferReply();
    const wsPing = interaction.client.ws.ping;

    const statusDoc = await db.collection("botStatus").doc("main").get();
    const status = statusDoc.exists ? statusDoc.data() : null;

    const embed = new EmbedBuilder()
      .setTitle("🏓 Bot Status")
      .setColor(status?.online ? 0x00ff00 : 0xff0000)
      .addFields(
        { name: "Discord Ping", value: `${wsPing}ms`, inline: true },
        { name: "Bot Online", value: status ? (status.online ? "🟢 Yes" : "🔴 No") : "❌ N/A", inline: true },
        { name: "Ping Recorded", value: status ? `${status.ping}ms` : "❌ N/A", inline: true },
        { name: "Servers", value: status ? `${status.servers}` : "❌ N/A", inline: true },
        { name: "Users", value: status ? `${status.users}` : "❌ N/A", inline: true },
        { name: "Last Update", value: status ? new Date(status.timestamp).toLocaleString() : "❌ N/A" }
      )
      .setFooter({ text: "Bot live status from Firestore" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
