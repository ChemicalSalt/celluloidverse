// bot/client/commands/sendWOTD.js
const { SlashCommandBuilder } = require("discord.js");
const { cleanChannelId } = require("../../utils/helpers");
const { scheduleWordOfTheDay } = require("../../plugins/wotd");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sendwotd")
    .setDescription("Setup Word of the Day (Japanese only, UTC time)")
    .addStringOption(o =>
      o.setName("channel").setDescription("Channel ID or #channel").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("time").setDescription("HH:MM 24h format (UTC)").setRequired(true)
    )
    .addStringOption(o =>
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
      // Fetch existing plugin config safely
      const doc = await client.db.collection("guilds").doc(gid).get();
      const plugins = doc.data()?.plugins || {};

      // Get command options
      const channelId = cleanChannelId(interaction.options.getString("channel"));
      const time = interaction.options.getString("time");
      const language = interaction.options.getString("language") || "japanese";

      const p = { channelId, time, language, enabled: true };

      // Save to Firestore
      await client.db
        .collection("guilds")
        .doc(gid)
        .set({ plugins: { ...plugins, language: p } }, { merge: true });

      // Schedule job
      scheduleWordOfTheDay(client, gid, p);

      // Reply once ✅
      return interaction.reply({
        content: `✅ Word of the Day saved. Runs daily at ${time} UTC.`,
        ephemeral: true,
      });
    } catch (err) {
      console.error("🔥 Error in sendWOTD command:", err);
      return interaction.reply({
        content: "❌ Something went wrong while setting WOTD.",
        ephemeral: true,
      });
    }
  },
};
