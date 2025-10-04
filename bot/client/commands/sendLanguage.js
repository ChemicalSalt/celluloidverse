const { SlashCommandBuilder, ChannelType } = require("discord.js");
const { db } = require("../utils/firestore"); // Firestore helper
const { scheduleWordOfTheDay } = require("../cron/scheduler");
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
         .setDescription("Your timezone (e.g., Asia/Kolkata)")
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

      // Validate 24-hour HH:MM format
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(time)) {
        return interaction.editReply(
          "❌ Invalid time format. Please use HH:MM in 24-hour format."
        );
      }

      // Parse hour and minute
      const [hour, minute] = time.split(":").map(Number);

      // Convert local time to UTC
      const utcMoment = moment.tz({ hour, minute }, timezone).utc();
      const hourUTC = utcMoment.hour();
      const minuteUTC = utcMoment.minute();

      // Save plugin config to Firestore
      const pluginData = {
        enabled: true,
        channelId: channel.id,
        language,
        timezone,
        time,         // original local time
        hourUTC,
        minuteUTC
      };

      await db
        .collection("plugins")
        .doc(interaction.guild.id)
        .set({ language: pluginData }, { merge: true });

      // Schedule immediately
      scheduleWordOfTheDay(interaction.guild.id, pluginData);

      await interaction.editReply(
        `✅ Word of the Day configured for ${channel} at ${time} (${timezone}) in ${language}.`
      );
    } catch (err) {
      console.error("[/sendLanguage] error:", err);
      await interaction.editReply(
        "❌ Something went wrong while setting up Word of the Day."
      );
    }
  },
};
