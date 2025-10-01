// client/commands/sendWOTD.js
const { SlashCommandBuilder } = require("discord.js");

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
      o.setName("language").setDescription("Pick language").setRequired(true).addChoices({
        name: "Japanese",
        value: "japanese",
      })
    ),
  async execute(interaction) {
    const cleanChannelId = require("../../utils/helpers").cleanChannelId;
    const db = interaction.client.db;

    const channelId = cleanChannelId(interaction.options.getString("channel"));
    const time = interaction.options.getString("time");
    const language = interaction.options.getString("language") || "japanese";

    const p = { channelId, time, language, enabled: true };

    const gid = interaction.guildId;
    const docRef = db.collection("guilds").doc(gid);

    try {
      const doc = await docRef.get();
      const plugins = doc.exists ? (doc.data()?.plugins || {}) : {};
      await docRef.set({ plugins: { ...plugins, language: p } }, { merge: true });

      // schedule immediately
      const wotdPlugin = require("../../plugins/wotd");
      if (wotdPlugin && wotdPlugin.scheduleWordOfTheDay) {
        wotdPlugin.scheduleWordOfTheDay(gid, p);
      }

      return interaction.reply({ content: `✅ WOTD saved. Runs daily at ${time} UTC.`, ephemeral: true });
    } catch (err) {
      console.error("🔥 sendwotd command error:", err);
      return interaction.reply({ content: "❌ Something went wrong saving WOTD.", ephemeral: true });
    }
  },
};
