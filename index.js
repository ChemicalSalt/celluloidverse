const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),
].map(command => command.toJSON());

// Register commands for your server
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

// Listen for slash command interactions
client.on("interactionCreate", async interaction => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === "ping") {
    await interaction.reply("Pong! 🏓");
  }
});

client.login(process.env.TOKEN);
