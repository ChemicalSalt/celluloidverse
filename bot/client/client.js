const { Client, GatewayIntentBits, Partials, Collection, REST, Routes } = require("discord.js");
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const { getSheetsClient } = require("../utils/sheets");

// --- Discord Client ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.GuildMember],
});

client.commands = new Collection();

// --- Firebase ---
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
client.db = admin.firestore();

// --- Google Sheets ---
const { auth, sheets } = getSheetsClient(process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT);
client.sheetsAuth = auth;
client.sheets = sheets;
client.SPREADSHEET_ID = process.env.SPREADSHEET_ID;
client.RANGE = "Sheet1!A:H";

// --- Load Commands ---
const commandsPath = path.join(__dirname, "commands");
fs.readdirSync(commandsPath).forEach(file => {
  if (file.endsWith(".js")) {
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.data.name, command);
  }
});

// --- Slash Commands Registration ---
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: client.commands.map(c => c.data.toJSON()) }
    );
    console.log("✅ Slash commands registered");
  } catch (err) {
    console.error("🔥 Slash registration error:", err);
  }
})();

// --- Load Events ---
const eventsPath = path.join(__dirname, "events");
fs.readdirSync(eventsPath).forEach(file => {
  if (file.endsWith(".js")) {
    const event = require(path.join(eventsPath, file));
    const eventName = file.split(".")[0];
    if (eventName === "ready") {
      client.once("ready", () => event(client));
    } else if (eventName === "guildMemberAdd") {
      client.on("guildMemberAdd", (member) => event(member));
    } else if (eventName === "guildMemberRemove") {
      client.on("guildMemberRemove", (member) => event(member));
    }
  }
});

// --- Interaction Handler ---
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error("🔥 Interaction error:", err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: "❌ Something went wrong", flags: 64 });
    } else {
      await interaction.followUp({ content: "❌ Something went wrong", flags: 64 });
    }
  }
});

module.exports = client;
