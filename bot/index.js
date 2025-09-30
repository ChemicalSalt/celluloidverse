require("dotenv").config();
const express = require("express");
const { client } = require("./client/client");
const { scheduleWordOfTheDay } = require("./plugins/wotd");
const { handleWelcome } = require("./plugins/welcome");
const { handleFarewell } = require("./plugins/farewell");
const { db } = require("./utils/firestore");
const rest = require("./client/commands/registerCommands");
const server = require("./web/server");
const cronScheduler = require("./cron/scheduler");

// Init events
client.once("ready", async () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);

  try {
    const snapshot = await db.collection("guilds").get();
    snapshot.docs.forEach((doc) => {
      const gid = doc.id;
      const plugins = doc.data()?.plugins || {};
      const lang = plugins.language || plugins.wotd;
      if (lang?.enabled) scheduleWordOfTheDay(client, gid, lang);
    });
  } catch (err) {
    console.error("🔥 Error loading guild configs on startup:", err);
  }

  db.collection("guilds").onSnapshot((snap) => {
    snap.docChanges().forEach((change) => {
      const gid = change.doc.id;
      const plugins = change.doc.data()?.plugins || {};
      const lang = plugins.language || plugins.wotd;
      scheduleWordOfTheDay(client, gid, lang);
    });
  });
});

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

// Initialize commands and slash command registration
(async () => {
  await rest.registerCommands(client);
})();

// Start the express server
server.startServer();

// Start Discord client login
client.login(process.env.TOKEN);

// Start cron jobs scheduling
cronScheduler.scheduleAll(client);
