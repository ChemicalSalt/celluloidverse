const { SlashCommandBuilder } = require("discord.js");
const { db } = require("../../utils/firestore");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sendwotd")
    .setDescription("Setup Word of the Day (Japanese only, UTC time)")
    .addStringOption((option) =>
      option.setName("channel").setDescription("Channel ID or #channel").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("time").setDescription("HH:MM 24h format (UTC)").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("language")
        .setDescription("Pick language")
        .setRequired(true)
        .addChoices({ name: "Japanese", value: "japanese" })
    ),
  async execute(interaction) {
    const guildId = interaction.guildId;
    const channelId = interaction.options.getString("channel").replace(/[^0-9]/g, "");
    const time = interaction.options.getString("time");
    const language = interaction.options.getString("language") || "japanese";

    const pluginData = { channelId, time, language, enabled: true };

    const docRef = db.collection("guilds").doc(guildId);
    const doc = await docRef.get();
    const plugins = doc.exists ? doc.data().plugins || {} : {};

    await docRef.set(
      { plugins: { ...plugins, language: pluginData } },
      { merge: true }
    );

    // Schedule WOTD immediately after saving
    const { scheduleWordOfTheDay } = require("../../plugins/wotd");
    scheduleWordOfTheDay(interaction.client, guildId, pluginData);

    await interaction.reply({ content: `✅ WOTD saved. Runs daily at ${time} UTC.`, ephemeral: true });
  },
};
