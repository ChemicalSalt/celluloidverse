const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sendLanguage")
    .setDescription("Setup Word of the Day")
    .addChannelOption(opt =>
      opt.setName("channel")
         .setDescription("Channel")
         .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("time")
         .setDescription("Time in 24-hour format HH:MM (global, no UTC needed)")
         .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("language")
         .setDescription("Pick language")
         .setRequired(true)
         .addChoices({ name: "Japanese", value: "japanese" })
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const channel = interaction.options.getChannel("channel");
      const time = interaction.options.getString("time");
      const language = interaction.options.getString("language");

      // Validate 24-hour HH:MM format
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(time)) {
        return interaction.editReply(
          "❌ Invalid time format. Please use HH:MM in 24-hour format (e.g., 14:30)."
        );
      }

      // The rest remains unchanged
      await interaction.editReply(
        `✅ WOTD configured for ${channel} at ${time} (${language}).`
      );
    } catch (err) {
      console.error("[/sendLanguage] error:", err);
      await interaction.editReply(
        "❌ Something went wrong while setting up Word of the Day."
      );
    }
  },
};
