// plugins/language.js
const { google } = require("googleapis");
const { sanitizeDynamic } = require("../utils/sanitize");
const moment = require("moment-timezone");

let clientRef;
function setClient(client) {
  clientRef = client;
}

// ======= GOOGLE AUTH SETUP =======
const sheetsAuth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT),
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets = google.sheets({ version: "v4", auth: sheetsAuth });

// ======= LANGUAGE CONFIG =======
const LANGUAGE_SHEETS = {
  japanese: {
    id: process.env.SHEET_ID_JAPANESE,
    range: "Sheet1!A:H",
    map: row => ({
      kanji: sanitizeDynamic(row[0] || ""),
      hiragana: sanitizeDynamic(row[1] || ""),
      romaji: sanitizeDynamic(row[2] || ""),
      meaning: sanitizeDynamic(row[3] || ""),
      sentenceJP: sanitizeDynamic(row[4] || ""),
      sentenceHiragana: sanitizeDynamic(row[5] || ""),
      sentenceRomaji: sanitizeDynamic(row[6] || ""),
      sentenceMeaning: sanitizeDynamic(row[7] || ""),
    }),
  },

  hindi: {
    id: process.env.SHEET_ID_HINDI,
    range: "Sheet1!A:F",
    map: row => ({
      word: sanitizeDynamic(row[0] || ""),
      romaji: sanitizeDynamic(row[1] || ""),
      meaning: sanitizeDynamic(row[2] || ""),
      sentence: sanitizeDynamic(row[3] || ""),
      sentenceRomaji: sanitizeDynamic(row[4] || ""),
      sentenceMeaning: sanitizeDynamic(row[5] || ""),
    }),
  },

  english: {
    id: process.env.SHEET_ID_ENGLISH,
    range: "Sheet1!A:E",
    map: row => ({
      word: sanitizeDynamic(row[0] || ""),
      synonym: sanitizeDynamic(row[1] || ""),
      partOfSpeech: sanitizeDynamic(row[2] || ""),
      meaning: sanitizeDynamic(row[3] || ""),
      sentence: sanitizeDynamic(row[4] || ""),
    }),
  },

  chinese: {
    id: process.env.SHEET_ID_CHINESE,
    range: "Sheet1!A:F",
    map: row => ({
      word: sanitizeDynamic(row[0] || ""),
      pinyin: sanitizeDynamic(row[1] || ""),
      meaning: sanitizeDynamic(row[2] || ""),
      sentence: sanitizeDynamic(row[3] || ""),
      sentencePinyin: sanitizeDynamic(row[4] || ""),
      sentenceMeaning: sanitizeDynamic(row[5] || ""),
    }),
  },

  arabic: {
    id: process.env.SHEET_ID_ARABIC,
    range: "Sheet1!A:F",
    map: row => ({
      word: sanitizeDynamic(row[0] || ""),
      romanization: sanitizeDynamic(row[1] || ""),
      meaning: sanitizeDynamic(row[2] || ""),
      sentence: sanitizeDynamic(row[3] || ""),
      sentenceRomanization: sanitizeDynamic(row[4] || ""),
      sentenceMeaning: sanitizeDynamic(row[5] || ""),
    }),
  },

  spanish: {
    id: process.env.SHEET_ID_SPANISH,
    range: "Sheet1!A:F",
    map: row => ({
      word: sanitizeDynamic(row[0] || ""),
      pronunciation: sanitizeDynamic(row[1] || ""),
      meaning: sanitizeDynamic(row[2] || ""),
      sentence: sanitizeDynamic(row[3] || ""),
      sentencePronunciation: sanitizeDynamic(row[4] || ""),
      sentenceMeaning: sanitizeDynamic(row[5] || ""),
    }),
  },
};

// ======= CORE FUNCTION =======
async function getRandomWord(language = "japanese") {
  try {
    const config = LANGUAGE_SHEETS[language];
    if (!config) {
      console.error(`[Language] Unknown language: ${language}`);
      return null;
    }

    const authClient = await sheetsAuth.getClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: config.id,
      range: config.range,
      auth: authClient,
    });

    const rows = res.data.values || [];
    if (!rows.length) return null;

    const validRows = rows.filter(r => r[0]);
    const row = validRows[Math.floor(Math.random() * validRows.length)];
    return config.map(row);
  } catch (err) {
    console.error(`[Language] Error fetching sheet for ${language}:`, err);
    return null;
  }
}

// ======= SEND MESSAGE TO DISCORD =======
async function sendLanguageNow(guildId, plugin) {
  if (!plugin?.enabled) return;
  if (!clientRef) return console.error("[Language] Client not set!");

  const guild = clientRef.guilds.cache.get(guildId);
  if (!guild) return console.warn(`[Language] Guild not found: ${guildId}`);

  const channel =
    guild.channels.cache.get(plugin.channelId) ||
    (await guild.channels.fetch(plugin.channelId).catch(() => null));

  if (!channel || channel.type !== 0) {
    return console.warn(`[Language] Invalid or missing channel: ${plugin.channelId}`);
  }

  const word = await getRandomWord(plugin.language || "japanese");
  if (!word) return console.warn("[Language] No word found in Google Sheet");

  let msg = "";

  switch (plugin.language) {
    case "japanese":
      msg = `📖 **Word of the Day — Japanese**
**Kanji:** ${word.kanji}
**Hiragana/Katakana:** ${word.hiragana}
**Romaji:** ${word.romaji}
**Meaning:** ${word.meaning}

📌 **Example Sentence**
**Kanji:** ${word.sentenceJP}
**Hiragana/Katakana:** ${word.sentenceHiragana}
**Romaji:** ${word.sentenceRomaji}
**Meaning:** ${word.sentenceMeaning}`;
      break;

    case "hindi":
      msg = `📖 **Word of the Day — Hindi**
**Word:** ${word.word}
**Romanization:** ${word.romaji}
**Meaning:** ${word.meaning}

📌 **Example Sentence**
**Hindi:** ${word.sentence}
**Romanization:** ${word.sentenceRomaji}
**Meaning:** ${word.sentenceMeaning}`;
      break;

    case "english":
      msg = `📖 **Word of the Day — English**
**Word:** ${word.word}
**Synonym:** ${word.synonym}
**Part of Speech:** ${word.partOfSpeech}
**Meaning:** ${word.meaning}

📌 **Example Sentence**
${word.sentence}`;
      break;

    case "chinese":
      msg = `📖 **Word of the Day — Mandarin Chinese**
**Word:** ${word.word}
**Pinyin:** ${word.pinyin}
**Meaning:** ${word.meaning}

📌 **Example Sentence**
**Chinese:** ${word.sentence}
**Pinyin:** ${word.sentencePinyin}
**Meaning:** ${word.sentenceMeaning}`;
      break;

    case "arabic":
      msg = `📖 **Word of the Day — Arabic**
**Word:** ${word.word}
**Romanization:** ${word.romanization}
**Meaning:** ${word.meaning}

📌 **Example Sentence**
**Arabic:** ${word.sentence}
**Romanization:** ${word.sentenceRomanization}
**Meaning:** ${word.sentenceMeaning}`;
      break;

    case "spanish":
      msg = `📖 **Word of the Day — Spanish**
**Word:** ${word.word}
**Pronunciation:** ${word.pronunciation}
**Meaning:** ${word.meaning}

📌 **Example Sentence**
**Spanish:** ${word.sentence}
**Pronunciation:** ${word.sentencePronunciation}
**Meaning:** ${word.sentenceMeaning}`;
      break;

    default:
      msg = `📖 **Word of the Day**
${JSON.stringify(word, null, 2)}`;
  }

  try {
    await channel.send({ content: msg, allowedMentions: { parse: [] } });
    console.log(`[Language] ✅ Sent successfully to guild ${guildId}`);
  } catch (e) {
    console.error("[Language] ❌ Send failed:", e);
  }
}

module.exports = { sendLanguageNow, setClient };
