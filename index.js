const express = require("express");
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require("discord.js");

// --- Express server to keep Render awake ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get(/.*/, (_req, res) => res.send("Bot is alive"));
app.listen(PORT, () => console.log(`Web server on ${PORT}`));

// --- Discord client ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// --- Slash command definition ---
const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),
].map(cmd => cmd.toJSON());

// --- Register slash command ---
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID),
      { body: commands }
    );
    console.log("Slash command registered!");
  } catch (error) {
    console.error(error);
  }
});

// --- Handle slash command interactions ---
client.on("interactionCreate", async interaction => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === "ping") {
    await interaction.reply("Pong!");
  }
});

// --- Login to Discord ---
client.login(process.env.TOKEN);
