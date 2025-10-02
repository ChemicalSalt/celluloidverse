const { db } = require("../../utils/firestore");
const { EmbedBuilder, SlashCommandBuilder, InteractionResponseFlags } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check if bot is alive"),

  async execute(interaction) {
    try {
      // Safely defer reply with ephemeral flag
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ flags: InteractionResponseFlags.Ephemeral });
      }

      const statusDoc = await db.collection("botStatus").doc("main").get();
      const status = statusDoc.exists ? statusDoc.data() : null;

      const embed = new EmbedBuilder()
        .setTitle("Bot Status")
        .setColor(status?.online ? 0x00ff00 : 0xff0000)
        .addFields(
          { name: "Signal", value: status ? (status.online ? "🟢 Online" : "🔴 Offline") : "❌ N/A", inline: false },
          { name: "Ping", value: status ? `${status.ping}ms` : "❌ N/A", inline: false },
          { name: "Servers", value: status ? `${status.servers}` : "❌ N/A", inline: false },
          { name: "Last Update", value: status ? new Date(status.timestamp).toLocaleString() : "❌ N/A", inline: false }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error("[/ping] error:", err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "❌ Something went wrong.", ephemeral: true }).catch(() => {});
      }
    }
  },
};
