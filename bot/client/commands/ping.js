const fetch = require("node-fetch");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "ping",
  description: "Check bot alive and status",
  async execute(interaction) {
    try {
      const wsPing = interaction.client.ws.ping;

      // Fetch live bot status from backend
      const res = await fetch(`${process.env.DASHBOARD_URL}/dashboard/status`);
      const statusData = res.ok ? await res.json() : null;

      const embed = new EmbedBuilder()
        .setTitle("🏓 Bot Status")
        .setColor(statusData?.online ? 0x00ff00 : 0xff0000)
        .addFields(
          { name: "Discord Ping", value: `${wsPing}ms`, inline: true },
          { name: "Bot Online", value: statusData ? (statusData.online ? "🟢 Yes" : "🔴 No") : "❌ N/A", inline: true },
          { name: "Ping Recorded", value: statusData ? `${statusData.ping}ms` : "❌ N/A", inline: true },
          { name: "Servers", value: statusData ? `${statusData.servers}` : "❌ N/A", inline: true },
          { name: "Users", value: statusData ? `${statusData.users}` : "❌ N/A", inline: true },
          { name: "Last Update", value: statusData ? new Date(statusData.timestamp).toLocaleString() : "❌ N/A", inline: false }
        )
        .setFooter({ text: "Bot live status from backend" })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error("[Ping] error:", err);
      await interaction.reply("❌ Something went wrong while fetching bot status.");
    }
  },
};
