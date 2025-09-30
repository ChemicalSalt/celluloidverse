// client/commands/index.js
const { REST, Routes, SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../../utils/firestore");
const { scheduleWordOfTheDay } = require("../../plugins/wotd");
const { cleanChannelId } = require("../../utils/helpers");

const commands = [
  require("./ping"),
  require("./dashboard"),
  require("./sendWOTD"),
  require("./sendWelcome"),
  require("./sendFarewell"),
];

module.exports = (client) => {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  (async () => {
    try {
      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands.map(c => c.data.toJSON()) });
      console.log("✅ Slash commands registered");
    } catch (err) {
      console.error("🔥 Slash registration error:", err);
    }
  })();

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    const gid = interaction.guildId;
    const docSnap = await db.collection("guilds").doc(gid).get();
    const plugins = docSnap.exists ? (docSnap.data()?.plugins || {}) : {};

    for (const cmd of commands) {
      if (interaction.commandName === cmd.data.name) {
        try { await cmd.execute(client, interaction, db, plugins); } 
        catch (err) { 
          console.error("🔥 Interaction handler error:", err);
          if (!interaction.replied) interaction.reply({ content: "❌ Something went wrong", ephemeral: true });
        }
        return;
      }
    }
  });
};
