const { SlashCommandBuilder, InteractionResponseFlags } = require("discord.js");
const { cleanChannelId } = require("../../utils/helpers");
const { scheduleWordOfTheDay } = require("../../plugins/wotd");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sendwotd")
    .setDescription("Setup Word of the Day (Japanese only, UTC time)")
    .addStringOption((o) =>
      o.setName("channel").setDescription("Channel ID or #channel").setRequired(true)
    )
    .addStringOption((o) =>
      o.setName("time").setDescription("HH:MM 24h format (UTC)").setRequired(true)
    )
    .addStringOption((o) =>
      o
        .setName("language")
        .setDescription("Pick language")
        .setRequired(true)
        .addChoices({ name: "Japanese", value: "japanese" })
    ),

  async execute(interaction) {
    const client = interaction.client;
    const gid = interaction.guildId;

    try {
      // 1️⃣ Immediately defer the reply
      await interaction.deferReply({ flags: InteractionResponseFlags.Ephemeral });

      // 2️⃣ Fetch existing plugin config safely
      const doc = await client.db.collection("guilds").doc(gid).get();
      const plugins = doc.data()?.plugins || {};

      // 3️⃣ Get command options
      const channelId = cleanChannelId(interaction.options.getString("channel"));
      const time = interaction.options.getString("time");
      const language = interaction.options.getString("language") || "japanese";

      const p = { channelId, time, language, enabled: true };

      // 4️⃣ Save updated plugin settings to Firestore
      await client.db
        .collection("guilds")
        .doc(gid)
        .set({ plugins: { ...plugins, language: p } }, { merge: true });

      // 5️⃣ Schedule the WOTD cron job
      scheduleWordOfTheDay(client, gid, p);

      // 6️⃣ Edit deferred reply
      return interaction.editReply({
        content: `✅ Word of the Day saved. Runs daily at ${time} UTC.`,
      });
    } catch (err) {
      console.error("🔥 Error in sendWOTD command:", err);
      // Edit reply even on error
      if (interaction.deferred || interaction.replied) {
        return interaction.editReply({
          content: "❌ Something went wrong while setting WOTD.",
        });
      } else {
        return interaction.reply({
          content: "❌ Something went wrong while setting WOTD.",
          ephemeral: true,
        });
      }
    }
  },
};
