const { SlashCommandBuilder, ChannelType } = require("discord.js");
const moment = require("moment-timezone");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sendLanguage")
    .setDescription("Setup Word of the Day")
    .addChannelOption(opt =>
      opt.setName("channel")
         .setDescription("Channel")
         .addChannelTypes(ChannelType.GuildText)
         .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("time")
         .setDescription("Time in 24-hour format HH:MM")
         .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("timezone")
         .setDescription("Timezone (e.g., Asia/Kolkata, America/New_York)")
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
      const timezone = interaction.options.getString("timezone");
      const language = interaction.options.getString("language");

      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(time)) {
        return interaction.editReply(
          "❌ Invalid time format. Use HH:MM 24-hour format (e.g., 14:30)."
        );
      }

      if (!moment.tz.zone(timezone)) {
        return interaction.editReply("❌ Invalid timezone.");
      }

      // Convert local time to UTC
      const [hour, minute] = time.split(":").map(Number);
      const utcTime = moment.tz({ hour, minute }, timezone).utc().format("HH:mm");

      // Save channel, utcTime, language, timezone to DB here

      await interaction.editReply(
        `✅ WOTD scheduled for ${channel} at ${time} ${timezone} (UTC: ${utcTime}) (${language})`
      );
    } catch (err) {
      console.error("[/sendLanguage] error:", err);
      await interaction.editReply(
        "❌ Something went wrong while setting up Word of the Day."
      );
    }
  },
};
