const { SlashCommandBuilder, ChannelType } = require("discord.js");
const { db } = require("../utils/firestore");
const { scheduleWordOfTheDay } = require("../cron/scheduler");
const moment = require("moment-timezone");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sendlanguage")
    .setDescription("Setup Word of the Day for your server (local-time based)")
    .addChannelOption(opt =>
      opt
        .setName("channel")
        .setDescription("Select the text channel to send the Word of the Day")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName("time")
        .setDescription("Enter local time in 24-hour format (HH:MM)")
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
        .setDescription("Choose the language for Word of the Day")
        .setRequired(true)
        .addChoices(
          { name: "Japanese", value: "japanese" },
          { name: "Hindi", value: "hindi" },
          { name: "English", value: "english" },
          { name: "Mandarin", value: "mandarin" },
          { name: "Arabic", value: "arabic" }
        )
    ),

  async execute(interaction) {
    try {
      const channel = interaction.options.getChannel("channel");
      const time = interaction.options.getString("time");
      const timezone = interaction.options.getString("timezone").trim();
      const language = interaction.options.getString("language");

      // ✅ Validate time format
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(time)) {
        return interaction.reply("❌ Please enter time in **24-hour format** (e.g. 18:30).");
      }

      // ✅ Validate timezone
      if (!moment.tz.zone(timezone)) {
        return interaction.reply("❌ Invalid timezone. Example: Asia/Kolkata, America/New_York, Europe/London");
      }

      // ✅ Convert local → UTC
      const [hour, minute] = time.split(":").map(Number);
      const utcMoment = moment.tz({ hour, minute }, timezone).utc();
      const utcFormatted = utcMoment.format("HH:mm");

      // ✅ Save config to Firestore
      const pluginData = {
        enabled: true,
        channelId: channel.id,
        language,
        timezone,
        localTime: time,
        utcTime: utcFormatted,
        updatedAt: new Date().toISOString(),
      };
// Save config to Firestore
await db
  .collection("guilds")
  .doc(interaction.guild.id)
  .set({ language: { [language]: pluginData } }, { merge: true });

// ✅ Schedule cron job
scheduleWordOfTheDay(interaction.guild.id, { [language]: pluginData }, language);

      // ✅ Confirmation message
      await interaction.reply(
        `✅ **Word of the Day setup complete!**
📚 Language: **${capitalize(language)}**
📢 Channel: ${channel}
🕓 Local Time: **${time} (${timezone})**
🌍 UTC Time: **${utcFormatted} UTC**

The word will be sent automatically every day.`
      );

      console.log(
        `[Scheduler] ${interaction.guild.name} (${interaction.guild.id}) → ${language.toUpperCase()} | Local: ${time} (${timezone}) | UTC: ${utcFormatted}`
      );
    } catch (err) {
      console.error("[sendlanguage] Error:", err);
      interaction.reply("❌ Something went wrong while setting up Word of the Day.");
    }
  },
};

// Helper
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
