// client/commands/ping.js
// (kept for reference if you want command-based loaders later)
module.exports = {
  name: "ping",
  description: "Check bot alive",
  async execute(interaction) {
    await interaction.reply("🏓 Pong!");
  },
};
