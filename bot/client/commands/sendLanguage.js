const { SlashCommandBuilder, ChannelType } = require("discord.js");
const { db } = require("../utils/firestore");
const { scheduleWordOfTheDay } = require("../cron/scheduler");
const moment = require("moment-timezone");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sendlanguage")
    .setDescription("Setup Word of the Day for your server (local-time based)")
    .addChannelOption(opt =>
      opt.setName("channel")
         .setDescription("Select the text channel to send the Word of the Day")
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
         .setDescription("Enter your timezone (e.g. Asia/Kolkata)")
         .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("language")
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

      // Validate time
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(time))
        return interaction.reply("❌ Time must be in 24-hour format (HH:MM).");

      // Validate timezone
      if (!moment.tz.zone(timezone))
        return interaction.reply("❌ Invalid timezone.");

      // Convert local → UTC
      const [hour, minute] = time.split(":").map(Number);
      const utcTime = moment.tz({ hour, minute }, timezone).utc().format("HH:mm");

      // Plugin object
      const pluginData = {
        enabled: true,
        channelId: channel.id,
        timezone,
        localTime: time,
        utcTime,
        updatedAt: new Date().toISOString(),
      };

      // Save under language map
     await db
  .collection("guilds")
  .doc(interaction.guild.id)
  .set({ plugins: { language: { [language]: pluginData } } }, { merge: true });

      // Schedule
    scheduleWordOfTheDay(interaction.guild.id, pluginData, language);


      await interaction.reply(
        `✅ **Word of the Day setup complete!**
📚 Language: **${capitalize(language)}**
📢 Channel: ${channel}
🕓 Local: **${time} (${timezone})**
🌍 UTC: **${utcTime} UTC**`
      );

      console.log(`[Scheduler] ${interaction.guild.id} → ${language} | Local: ${time} | UTC: ${utcTime}`);
    } catch (err) {
      console.error(err);
      interaction.reply("❌ Something went wrong.");
    }
  },
};

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
