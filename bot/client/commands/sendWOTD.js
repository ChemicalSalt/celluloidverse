const { SlashCommandBuilder } = require("discord.js");
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
      // ✅ Defer reply (ephemeral)
      await interaction.deferReply({ ephemeral: true });

      // 🔹 Fetch existing plugin config
      const doc = await client.db.collection("guilds").doc(gid).get();
      const plugins = doc.data()?.plugins || {};

      // 🔹 Get command options
      const channelId = cleanChannelId(interaction.options.getString("channel"));
      const time = interaction.options.getString("time");
      const language = interaction.options.getString("language") || "japanese";

      const p = { channelId, time, language, enabled: true };

      // 🔹 Save updated plugin settings to Firestore
      await client.db
        .collection("guilds")
        .doc(gid)
        .set({ plugins: { ...plugins, wotd: p } }, { merge: true });

      // 🔹 Schedule the WOTD cron job
      scheduleWordOfTheDay(client, gid, p);

      // ✅ Edit deferred reply
      return interaction.editReply({
        content: `✅ Word of the Day saved. Runs daily at ${time} UTC.`,
      });
    } catch (err) {
      console.error("🔥 Error in sendWOTD command:", err);

      const errorMessage = { content: "❌ Something went wrong while setting WOTD." };

      // ✅ Avoid "already acknowledged" bug
      if (interaction.deferred || interaction.replied) {
        return interaction.editReply(errorMessage);
      } else {
        return interaction.reply({ ...errorMessage, ephemeral: true });
      }
    }
  },
};
