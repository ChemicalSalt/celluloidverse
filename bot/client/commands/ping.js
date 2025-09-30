const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { db } = require("../utils/firestore");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check bot alive and see live status"),

  async execute(interaction) {
    try {
      // Defer the reply (acknowledge interaction immediately)
      await interaction.deferReply({ ephemeral: true });

      // Fetch live status from Firestore
      const doc = await db.collection("botStatus").doc("main").get();
      const status = doc.exists ? doc.data() : null;

      // Build embed
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

      // Edit the deferred reply with embed
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error("🔥 Ping command error:", err);
      if (!interaction.replied) {
        await interaction.reply({ content: "❌ Failed to fetch bot status", ephemeral: true });
      }
    }
  },
};
