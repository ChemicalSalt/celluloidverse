const { SlashCommandBuilder, ChannelType } = require("discord.js");
const { db } = require("../utils/firestore");
const { scheduleWordOfTheDay } = require("../cron/scheduler");
const moment = require("moment-timezone");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sendlanguage")
    .setDescription("Setup Word of the Day for your server (local-time based)")
    .addStringOption(opt =>
      opt.setName("language")
        .setDescription("Choose the language")
        .setRequired(true)
        .addChoices(
          { name: "Japanese", value: "japanese" },
          { name: "Hindi", value: "hindi" },
          { name: "English", value: "english" },
          { name: "Mandarin", value: "mandarin" },
          { name: "Arabic", value: "arabic" }
        )
    )
    .addChannelOption(opt =>
      opt.setName("channel")
        .setDescription("Channel to send Word of the Day in")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    )
    .addStringOption(opt =>
      opt.setName("time")
        .setDescription("Time in 24-hour format (e.g. 19:30)")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("timezone")
        .setDescription("Timezone (e.g. Asia/Kolkata, Europe/London)")
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      // collect input
      const guildId = interaction.guild.id;
      const language = interaction.options.getString("language");
      const channel = interaction.options.getChannel("channel");
      const time = interaction.options.getString("time");
      const timezone = interaction.options.getString("timezone");

      // validate timezone
      if (!moment.tz.zone(timezone)) {
        return interaction.reply("❌ Invalid timezone. Example: `Asia/Kolkata`");
      }

      // validate time
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(time)) {
        return interaction.reply("❌ Invalid time format. Use `HH:mm` (24-hour).");
      }

      // convert local → UTC
      const [hour, minute] = time.split(":").map(Number);
      const utcTime = moment.tz({ hour, minute }, timezone).utc().format("HH:mm");
      const updatedAt = new Date().toISOString();

      // ✅ Firestore structure: plugins.language.<language>
      await db.collection("guilds").doc(guildId).set({
        plugins: {
          language: {
            [language]: {
              enabled: true,
              channelId: channel.id,
              time,
              timezone,
              utcTime,
              updatedAt,
            },
          },
        },
      }, { merge: true });

      // ✅ Schedule job
      scheduleWordOfTheDay(guildId, {
        enabled: true,
        channelId: channel.id,
        time,
        timezone,
        utcTime,
      }, language);

      // ✅ Confirm to user (no ephemeral, no double reply)
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply(
          `✅ Word of the Day scheduled for **${language}** at **${time} (${timezone})** → <#${channel.id}>`
        );
      }

    } catch (err) {
      console.error("❌ Error in /sendlanguage:", err);
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply("⚠️ Something went wrong while saving or scheduling.");
        }
      } catch (e) {
        console.error("Reply failed:", e);
      }
    }
  },
};
