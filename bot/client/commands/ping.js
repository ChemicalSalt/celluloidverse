const { db } = require("../utils/firestore");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "ping",
  description: "Check bot alive and status",
  async execute(interaction) {
    try {
      const wsPing = interaction.client.ws.ping;

      // Fetch Firestore document at botStatus/main
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
          { name: "Last Update", value: status ? new Date(status.timestamp).toLocaleString() : "❌ N/A", inline: false }
        )
        .setFooter({ text: "Bot live status from Firestore" })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error("[Ping] error:", err);
      await interaction.reply("❌ Something went wrong while fetching bot status.");
    }
  },
};
