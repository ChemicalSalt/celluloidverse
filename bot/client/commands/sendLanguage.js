const { SlashCommandBuilder, ChannelType } = require("discord.js");
const { db } = require("../utils/firestore");
const { scheduleWordOfTheDay } = require("../cron/scheduler");
const moment = require("moment-timezone");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sendlanguage")
    .setDescription("Set up automatic Word of the Day")
    .addChannelOption(opt =>
      opt.setName("channel")
         .setDescription("Select the channel to post the Word of the Day")
         .addChannelTypes(ChannelType.GuildText)
         .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("time")
         .setDescription("Enter local time in 24-hour format (HH:MM)")
         .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("timezone")
         .setDescription("Your IANA timezone (e.g. Asia/Kolkata, Europe/London)")
         .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("language")
         .setDescription("Select the language for Word of the Day")
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
        return interaction.editReply("❌ Invalid time format. Use HH:MM (24-hour).");
      }

      // Validate timezone
      if (!moment.tz.zone(timezone)) {
        return interaction.editReply("❌ Invalid timezone. Example: Asia/Kolkata");
      }

      const [hour, minute] = time.split(":").map(Number);
      const utcMoment = moment.tz({ hour, minute }, timezone).utc();

      const pluginData = {
        enabled: true,
        channelId: channel.id,
        language,
        timezone,
        time,
        hourUTC: utcMoment.hour(),
        minuteUTC: utcMoment.minute(),
      };

      await db.collection("plugins")
              .doc(interaction.guild.id)
              .set({ language: pluginData }, { merge: true });

      scheduleWordOfTheDay(interaction.guild.id, pluginData);

      await interaction.editReply(
        `✅ Word of the Day configured!\n**Channel:** ${channel}\n**Time:** ${time} (${timezone})\n**Language:** ${language}`
      );
    } catch (err) {
      console.error("[/sendlanguage] Error:", err);
      await interaction.editReply("❌ Something went wrong while setting up the schedule.");
    }
  },
};
