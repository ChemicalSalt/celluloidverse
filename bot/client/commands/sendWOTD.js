const { SlashCommandBuilder } = require("discord.js");
const { cleanChannelId } = require("../../utils/helpers");
const { db } = require("../../utils/firestore");
const { scheduleWordOfTheDay } = require("../../plugins/wotd");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sendwotd")
    .setDescription("Setup Word of the Day (Japanese only, UTC time)")
    .addStringOption((o) => o.setName("channel").setDescription("Channel ID or #channel").setRequired(true))
    .addStringOption((o) => o.setName("time").setDescription("HH:MM 24h format (UTC)").setRequired(true))
    .addStringOption((o) =>
      o.setName("language").setDescription("Pick language").setRequired(true).addChoices({
        name: "Japanese",
        value: "japanese",
      })
    ),
  async execute(interaction, client) {
    const gid = interaction.guildId;
    const docSnap = await db.collection("guilds").doc(gid).get();
    const plugins = docSnap.exists ? (docSnap.data()?.plugins || {}) : {};

    const channelId = cleanChannelId(interaction.options.getString("channel"));
    const time = interaction.options.getString("time");
    const language = interaction.options.getString("language") || "japanese";

    const p = { channelId, time, language, enabled: true };
    await db.collection("guilds").doc(gid).set({ plugins: { ...plugins, language: p } }, { merge: true });

    scheduleWordOfTheDay(gid, p, client);

    await interaction.reply({ content: `✅ WOTD saved. Runs daily at ${time} UTC.`, ephemeral: true });
  },
};
