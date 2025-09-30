const { Client, GatewayIntentBits, Partials } = require("discord.js");
const { handleWelcome, handleFarewell } = require("../plugins/welcome");
const { db } = require("../utils/firestore");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.GuildMember],
});

// Member events
client.on("guildMemberAdd", async (member) => {
  try {
    const doc = await db.collection("guilds").doc(member.guild.id).get();
    await handleWelcome(member, doc.data()?.plugins?.welcome);
  } catch (err) {
    console.error(err);
  }
});

client.on("guildMemberRemove", async (member) => {
  try {
    const doc = await db.collection("guilds").doc(member.guild.id).get();
    await handleFarewell(member, doc.data()?.plugins?.farewell);
  } catch (err) {
    console.error(err);
  }
});

module.exports = client;
