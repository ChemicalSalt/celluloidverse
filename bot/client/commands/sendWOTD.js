const { SlashCommandBuilder } = require("discord.js");
const { cleanChannelId } = require("../../utils/helpers");
const { scheduleWordOfTheDay } = require("../../plugins/wotd");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sendwotd")
    .setDescription("Setup Word of the Day (Japanese only, UTC time)")
    .addStringOption(o => o.setName("channel").setDescription("Channel ID or #channel").setRequired(true))
    .addStringOption(o => o.setName("time").setDescription("HH:MM 24h format (UTC)").setRequired(true))
    .addStringOption(o => o.setName("language").setDescription("Pick language").setRequired(true).addChoices({ name: "Japanese", value: "japanese" })),
  async execute(interaction) {
    const db = interaction.client.db;
    const gid = interaction.guildId;
    const pluginsDoc = (await db.collection("guilds").doc(gid).get()).data()?.plugins || {};

    const channelId = cleanChannelId(interaction.options.getString("channel"));
    const time = interaction.options.getString("time");
    const language = interaction.options.getString("language") || "japanese";

    const plugin = { channelId, time, language, enabled: true };

    await db.collection("guilds").doc(gid).set({ plugins: { ...pluginsDoc, language: plugin } }, { merge: true });
    scheduleWordOfTheDay(interaction.client, gid, plugin);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: `✅ WOTD saved. Runs daily at ${time} UTC.`, flags: 64 });
    } else {
      await interaction.reply({ content: `✅ WOTD saved. Runs daily at ${time} UTC.`, flags: 64 });
    }
  },
};
