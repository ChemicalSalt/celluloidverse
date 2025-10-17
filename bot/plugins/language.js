// plugins/language.js
const { google } = require("googleapis");
const { sanitizeDynamic } = require("../utils/sanitize");

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
    map: (row) => ({
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
    map: (row) => ({
      word: sanitizeDynamic(row[0] || ""),
      romanization: sanitizeDynamic(row[1] || ""),
      meaning: sanitizeDynamic(row[2] || ""),
      sentence: sanitizeDynamic(row[3] || ""),
      sentenceRomanization: sanitizeDynamic(row[4] || ""),
      sentenceMeaning: sanitizeDynamic(row[5] || ""),
    }),
  },
  english: {
    id: process.env.SHEET_ID_ENGLISH,
    range: "Sheet1!A:E",
    map: (row) => ({
      word: sanitizeDynamic(row[0] || ""),
      synonym: sanitizeDynamic(row[1] || ""),
      partOfSpeech: sanitizeDynamic(row[2] || ""),
      meaning: sanitizeDynamic(row[3] || ""),
      sentence: sanitizeDynamic(row[4] || ""),
    }),
  },
  mandarin: {
    id: process.env.SHEET_ID_MANDARIN,
    range: "Sheet1!A:F",
    map: (row) => ({
      word: sanitizeDynamic(row[0] || ""),
      romanization: sanitizeDynamic(row[1] || ""),
      meaning: sanitizeDynamic(row[2] || ""),
      sentence: sanitizeDynamic(row[3] || ""),
      sentenceRomanization: sanitizeDynamic(row[4] || ""),
      sentenceMeaning: sanitizeDynamic(row[5] || ""),
    }),
  },
  arabic: {
    id: process.env.SHEET_ID_ARABIC,
    range: "Sheet1!A:F",
    map: (row) => ({
      word: sanitizeDynamic(row[0] || ""),
      romanization: sanitizeDynamic(row[1] || ""),
      meaning: sanitizeDynamic(row[2] || ""),
      sentence: sanitizeDynamic(row[3] || ""),
      sentenceRomanization: sanitizeDynamic(row[4] || ""),
      sentenceMeaning: sanitizeDynamic(row[5] || ""),
    }),
  },
};

// ======= FETCH RANDOM WORD =======
async function getRandomWord(language = "mandarin") {
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

    const validRows = rows.filter((r) => r[0]);
    const row = validRows[Math.floor(Math.random() * validRows.length)];
    return config.map(row);
  } catch (err) {
    console.error(`[Language] Error fetching sheet for ${language}:`, err);
    return null;
  }
}

// ======= BUILD MESSAGE =======
function buildMessage(language, word) {
  switch (language) {
    case "japanese":
      return `📖 **Word of the Day — Japanese**
**Kanji:** ${word.kanji}
**Hiragana:** ${word.hiragana}
**Romanization:** ${word.romaji}
**Meaning:** ${word.meaning}

📌 **Example Sentence**
${word.sentenceJP} (${word.sentenceRomaji})
Meaning: ${word.sentenceMeaning}`;

    case "hindi":
      return `📖 **Word of the Day — Hindi**
**Word:** ${word.word}
**Romanization:** ${word.romanization}
**Meaning:** ${word.meaning}

📌 ${word.sentence}
(${word.sentenceRomanization})
Meaning: ${word.sentenceMeaning}`;

    case "english":
      return `📖 **Word of the Day — English**
**Word:** ${word.word}
**Synonym:** ${word.synonym}
**Part of Speech:** ${word.partOfSpeech}
**Meaning:** ${word.meaning}
📌 ${word.sentence}`;

    case "mandarin":
      return `📖 **Word of the Day — Mandarin**
**Word:** ${word.word}
**Romanization:** ${word.romanization}
**Meaning:** ${word.meaning}

📌 ${word.sentence}
(${word.sentenceRomanization})
Meaning: ${word.sentenceMeaning}`;

    case "arabic":
      return `📖 **Word of the Day — Arabic**
**Word:** ${word.word}
**Romanization:** ${word.romanization}
**Meaning:** ${word.meaning}

📌 ${word.sentence}
(${word.sentenceRomanization})
Meaning: ${word.sentenceMeaning}`;

    default:
      return `📖 **Word of the Day — ${language}**
${JSON.stringify(word, null, 2)}`;
  }
}

// ======= MAIN SEND FUNCTION =======
async function sendLanguageNow(guildId, plugin, languageKey = "japanese") {
  console.log("[Language] sendLanguageNow called", { guildId, languageKey });

  if (!clientRef) {
    console.error("[Language] ❌ clientRef not set!");
    return;
  }

  const guild = clientRef.guilds.cache.get(guildId);
  if (!guild) {
    console.error(`[Language] ❌ Guild not found: ${guildId}`);
    return;
  }

  // Ensure plugin is in correct map form
  const pluginMap =
    plugin && plugin.channelId ? { [languageKey]: plugin } : plugin;

  for (const lang of Object.keys(pluginMap || {})) {
    const langConfig = pluginMap[lang];
    if (!langConfig?.enabled) {
      console.log(`[Language] Skipping ${lang} (disabled)`);
      continue;
    }

    const channel =
      guild.channels.cache.get(langConfig.channelId) ||
      (await guild.channels.fetch(langConfig.channelId).catch(() => null));

    if (!channel) {
      console.error(`[Language] ❌ Channel not found for ${lang}`);
      continue;
    }

    if (typeof channel.isTextBased === "function" ? !channel.isTextBased() : channel.type !== 0) {
      console.error(`[Language] ❌ Channel not text-based for ${lang}`);
      continue;
    }

    const word = await getRandomWord(lang);
    if (!word) {
      console.error(`[Language] ❌ No word fetched for ${lang}`);
      continue;
    }

    const msg = buildMessage(lang, word);
    await channel.send({ content: msg, allowedMentions: { parse: [] } });
    console.log(`[Language] ✅ Sent ${lang} word in guild ${guildId} -> #${channel.name}`);
  }
}

module.exports = { sendLanguageNow, setClient, getRandomWord };
