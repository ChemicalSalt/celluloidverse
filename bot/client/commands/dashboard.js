// client/commands/dashboard.js
module.exports = {
  name: "dashboard",
  description: "Open dashboard",
  async execute(interaction) {
    await interaction.reply({
      embeds: [
        {
          title: "➡ Open Dashboard",
          description: "Click to access backend dashboard",
          url: process.env.DASHBOARD_URL || "https://example.com",
        },
      ],
    });
  },
};
