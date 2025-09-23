require("dotenv").config();
const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
} = require("discord.js");
const admin = require("firebase-admin");
const express = require("express");
const cron = require("node-cron");
const { google } = require("googleapis");
const path = require("path");

const app = express();
app.use(express.json());

// --- Initialize Discord Client ---
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.GuildMember]
});

// --- Initialize Firebase ---
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

// --- Google Sheets Setup ---
const sheetsAuth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "serviceAccountKey.json"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
});
const sheets = google.sheets({ version: "v4", auth: sheetsAuth });
const SPREADSHEET_ID = "1nRaiJ3m0z7o9Wq_zNeUm07v5f_JbbX8oTUkNz085pzg";
const RANGE = "Sheet1!A:H"; // All relevant columns

async function getRandomWord() {
  const clientSheets = await sheetsAuth.getClient();
  const res = await sheets.spreadsheets.values.get({
    auth: clientSheets,
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE
  });
  const rows = res.data.values || [];
  if (rows.length === 0) return null;

  // Pick random row
  const row = rows[Math.floor(Math.random() * rows.length)];
  return {
    kanji: row[0] || "",
    hiragana: row[1] || "",
    romaji: row[2] || "",
    meaning: row[3] || "",
    sentenceJP: row[4] || "",
    sentenceHiragana: row[5] || "",
    sentenceRomaji: row[6] || "",
    sentenceMeaning: row[7] || "",
  };
}

// --- Bot Ready ---
client.once("ready", async () => {
  console.log(`Bot logged in as ${client.user.tag}`);

  // Pre-fetch members for all guilds
  for (const guild of client.guilds.cache.values()) {
    await guild.members.fetch();
  }

  // --- Schedule language plugin per guild based on Firestore ---
  const snapshot = await db.collection("guilds").get();
  snapshot.docs.forEach(doc => {
    const guildId = doc.id;
    const lang = doc.data()?.plugins?.language;
    if (!lang || !lang.channelId || !lang.time || !lang.enabled) return;

    // Extract hour & minute from saved "HH:MM"
    const [hour, minute] = lang.time.split(":");

    // Cron schedule
    cron.schedule(`${minute} ${hour} * * *`, async () => {
      try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return;

        const channel = guild.channels.cache.get(lang.channelId);
        if (!channel) return;

        const word = await getRandomWord();
        if (!word) return;

        const message = `📖 **Japanese Word of the Day**  
**Kanji:** ${word.kanji}  
**Hiragana/Katakana:** ${word.hiragana}  
**Romaji:** ${word.romaji}  
**Meaning:** ${word.meaning}  

📌 **Example Sentence**  
**JP:** ${word.sentenceJP}  
**Hiragana/Katakana:** ${word.sentenceHiragana}  
**Romaji:** ${word.sentenceRomaji}  
**English:** ${word.sentenceMeaning}`;

        await channel.send(message);
      } catch (err) {
        console.error(`Error sending word for guild ${guildId}:`, err);
      }
    });
  });
});

// --- Login ---
client.login(process.env.TOKEN);

// --- Express server ---
app.get("/", (_req, res) => res.send("Bot is alive"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`Web server listening on port ${PORT}`));
