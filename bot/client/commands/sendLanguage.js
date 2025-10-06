const { SlashCommandBuilder, ChannelType } = require("discord.js");
const { db } = require("../utils/firestore");
const { scheduleWordOfTheDay } = require("../cron/scheduler");
const moment = require("moment-timezone");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sendlanguage")
    .setDescription("Setup Word of the Day")
    .addChannelOption(opt =>
      opt
        .setName("channel")
        .setDescription("Select the text channel")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName("time")
        .setDescription("Enter time in 24-hour format (HH:MM)")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName("timezone")
        .setDescription("Select your timezone (e.g., Asia/Kolkata, America/New_York)")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName("language")
        .setDescription("Choose the Word of the Day language")
        .setRequired(true)
        .addChoices({ name: "Japanese", value: "japanese" })
    ),

  async execute(interaction) {
    try {
      const channel = interaction.options.getChannel("channel");
      const time = interaction.options.getString("time");
      const timezone = interaction.options.getString("timezone").trim();
      const language = interaction.options.getString("language");

      // ✅ Validate 24-hour format HH:MM
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(time)) {
        return interaction.reply("❌ Invalid time format. Use 24-hour format HH:MM (e.g., 17:30).");
      }

      // ✅ Validate timezone
      if (!moment.tz.zone(timezone)) {
        return interaction.reply("❌ Invalid timezone. Example: Asia/Kolkata, Europe/London, America/New_York");
      }

      // ✅ Build plugin data (local time + timezone only)
      const pluginData = {
        enabled: true,
        channelId: channel.id,
        language,
        timezone,
        time,
        updatedAt: new Date().toISOString(),
      };

      // ✅ Save config
      await db
        .collection("plugins")
        .doc(interaction.guild.id)
        .set({ language: pluginData }, { merge: true });

      // ✅ Schedule job
      scheduleWordOfTheDay(interaction.guild.id, pluginData);

      interaction.reply(
        `✅ Word of the Day scheduled in ${channel} for **${language}** at **${time} (${timezone})**.`
      );

      console.log(
        `[Scheduler] Scheduled Language for ${interaction.guild.id} at ${time} (${timezone})`
      );
    } catch (err) {
      console.error("[/sendlanguage] error:", err);
      interaction.reply("❌ Something went wrong while setting up Word of the Day.");
    }
  },
};
