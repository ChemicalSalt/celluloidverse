const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { db } = require("../utils/firestore"); // Firestore instance

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check bot alive and see status"),
  
  async execute(interaction) {
    try {
      // Fetch live bot status from Firestore
      const doc = await db.collection("botStatus").doc("main").get();
      const status = doc.exists ? doc.data() : null;

      // Build embed with bot status
      const embed = new EmbedBuilder()
        .setTitle("🏓 Pong!")
        .setColor(status?.online ? 0x00ff00 : 0xff0000)
        .setTimestamp()
        .addFields(
          { name: "Online", value: status ? `${status.online}` : "❌ Unknown", inline: true },
          { name: "Ping", value: status ? `${status.ping} ms` : "❌ Unknown", inline: true },
          { name: "Servers", value: status ? `${status.servers}` : "❌ Unknown", inline: true },
          { name: "Users", value: status ? `${status.users}` : "❌ Unknown", inline: true },
          { name: "Last Updated", value: status ? `${status.timestamp}` : "❌ Unknown", inline: false }
        );

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (err) {
      console.error("🔥 Ping command error:", err);
      if (!interaction.replied) {
        await interaction.reply({ content: "❌ Failed to fetch bot status", ephemeral: true });
      }
    }
  },
};
