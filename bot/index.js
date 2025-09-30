require("dotenv").config();
const client = require("./client/client");
const { REST, Routes, SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { db } = require("./utils/firestore");
const { scheduleWordOfTheDay } = require("./plugins/wotd");
const { TOKEN, CLIENT_ID, DASHBOARD_URL } = require("./config/botConfig");
require("./web/server"); // start Express

// --- Slash Commands ---
const commands = [
  new SlashCommandBuilder().setName("ping").setDescription("Check bot alive"),
  new SlashCommandBuilder().setName("dashboard").setDescription("Open dashboard"),
  new SlashCommandBuilder()
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
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);
(async () => {
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("✅ Slash commands registered");
  } catch (err) {
    console.error("🔥 Slash registration error:", err);
  }
})();

// --- Ready event: schedule existing WOTD ---
client.once("ready", async () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);

  try {
    const snapshot = await db.collection("guilds").get();
    snapshot.docs.forEach((doc) => {
      const gid = doc.id;
      const plugins = doc.data()?.plugins || {};
      const lang = plugins.language || plugins.wotd;
      if (lang?.enabled) scheduleWordOfTheDay(gid, lang, client);
    });
  } catch (err) {
    console.error("🔥 Error loading guild configs on startup:", err);
  }

  // Live snapshot watcher
  db.collection("guilds").onSnapshot((snap) => {
    snap.docChanges().forEach((change) => {
      const gid = change.doc.id;
      const plugins = change.doc.data()?.plugins || {};
      const lang = plugins.language || plugins.wotd;
      scheduleWordOfTheDay(gid, lang, client);
    });
  });
});

// --- Interaction handler ---
client.on("interactionCreate", async (i) => {
  if (!i.isCommand()) return;
  const gid = i.guildId;
  const docSnap = await db.collection("guilds").doc(gid).get();
  const plugins = docSnap.exists ? (docSnap.data()?.plugins || {}) : {};

  try {
    if (i.commandName === "ping") return i.reply("🏓 Pong!");
    if (i.commandName === "dashboard") {
      return i.reply({
        embeds: [new EmbedBuilder().setTitle("➡ Open Dashboard").setDescription("Click to access backend dashboard").setURL(DASHBOARD_URL).setColor(0x00ff00)],
        ephemeral: true,
      });
    }

    if (i.commandName === "sendwotd") {
      const { cleanChannelId } = require("./utils/helpers");
      const channelId = cleanChannelId(i.options.getString("channel"));
      const time = i.options.getString("time");
      const language = i.options.getString("language") || "japanese";

      const p = { channelId, time, language, enabled: true };
      await db.collection("guilds").doc(gid).set({ plugins: { ...plugins, language: p } }, { merge: true });
      scheduleWordOfTheDay(gid, p, client);

      return i.reply({ content: `✅ WOTD saved. Runs daily at ${time} UTC.`, ephemeral: true });
    }
  } catch (err) {
    console.error("🔥 Interaction handler error:", err);
    if (!i.replied) return i.reply({ content: "❌ Something went wrong", ephemeral: true });
  }
});

client.login(TOKEN);
