const { SlashCommandBuilder, ChannelType } = require("discord.js");
const { db } = require("../utils/firestore");
const { scheduleWordOfTheDay } = require("../cron/scheduler");
const moment = require("moment-timezone");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sendlanguage")
    .setDescription("Setup Word of the Day (local-time based)")
    .addChannelOption(opt =>
      opt
        .setName("channel")
        .setDescription("Select the text channel where the word will be sent")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName("time")
        .setDescription("Enter your local time in 24-hour format (HH:MM)")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName("timezone")
        .setDescription("Enter your timezone (e.g. Asia/Kolkata, Europe/London)")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName("language")
        .setDescription("Select language for Word of the Day")
        .setRequired(true)
        .addChoices(
  { name: "Japanese", value: "japanese" },
  { name: "Hindi", value: "hindi" },
  { name: "English", value: "english" },
  { name: "Mandarin", value: "mandarin" },
  { name: "Arabic", value: "arabic" },
  { name: "French", value: "french" }
)

    ),

  async execute(interaction) {
    try {
      const channel = interaction.options.getChannel("channel");
      const time = interaction.options.getString("time");
      const timezone = interaction.options.getString("timezone").trim();
      const language = interaction.options.getString("language");

      // ✅ Validate time (HH:MM)
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(time)) {
        return interaction.reply("❌ Please enter time in 24-hour format HH:MM (e.g. 18:30).");
      }

      // ✅ Validate timezone
      if (!moment.tz.zone(timezone)) {
        return interaction.reply("❌ Invalid timezone. Example: Asia/Kolkata, America/New_York, Europe/London");
      }

      // ✅ Convert local time → UTC
      const [hour, minute] = time.split(":").map(Number);
      const utcMoment = moment.tz({ hour, minute }, timezone).utc();
      const utcFormatted = utcMoment.format("HH:mm");

      // ✅ Save configuration
      const pluginData = {
        enabled: true,
        channelId: channel.id,
        language,
        timezone,
        localTime: time,      // what user entered
        utcTime: utcFormatted, // converted for cron
        updatedAt: new Date().toISOString(),
      };

      await db
        .collection("plugins")
        .doc(interaction.guild.id)
        .set({ language: pluginData }, { merge: true });

      // ✅ Schedule with UTC time
      scheduleWordOfTheDay(interaction.guild.id, pluginData);

      // ✅ Confirm setup
      await interaction.reply(
        `**Word of the Day setup complete!**
📚 Language: **${language}**
📢 Channel: ${channel}
🕓 Local Time: **${time} (${timezone})**
🌍 UTC Time: **${utcFormatted} UTC**

The word will now be sent at your local time every day.`
      );

      console.log(
        `[Scheduler] ${interaction.guild.name} (${interaction.guild.id}) — Local: ${time} (${timezone}), UTC: ${utcFormatted}`
      );
    } catch (err) {
      console.error("[sendlanguage] Error:", err);
      interaction.reply("❌ Something went wrong while setting up Word of the Day.");
    }
  },
};
