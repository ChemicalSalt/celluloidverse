// plugins/wotd.js
const { sheets, sheetsAuth, SPREADSHEET_ID, RANGE } = require("../config/sheetsConfig");

/**
 * Fetch a random Japanese word from Google Sheets
 * @returns {Promise<object|null>}
 */
async function getRandomWord() {
  try {
    const clientSheets = await sheetsAuth.getClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
      auth: clientSheets,
    });
    const rows = res.data.values || [];
    if (!rows.length) return null;
    const dataRows = rows.filter((r) => r[0] && r[1]);
    const row = dataRows[Math.floor(Math.random() * dataRows.length)];
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
  } catch (err) {
    console.error("🔥 Error fetching WOTD:", err);
    return null;
  }
}

/**
 * Send WOTD to the configured channel in a guild
 * @param {Client} client Discord client
 * @param {string} guildId Guild ID
 * @param {object} plugin Plugin config (channelId, enabled)
 */
async function sendWOTDNow(client, guildId, plugin) {
  if (!plugin?.enabled) return;
  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return console.warn(`[WOTD] Guild not found: ${guildId}`);

    const channel =
      guild.channels.cache.get(plugin.channelId) ||
      (await guild.channels.fetch(plugin.channelId).catch(() => null));
    if (!channel) return console.warn(`[WOTD] Channel not found: ${plugin.channelId}`);

    const me = guild.members.me || (await guild.members.fetch(client.user.id).catch(() => null));
    if (!me || !channel.permissionsFor(me)?.has("SendMessages")) {
      return console.warn(`[WOTD] Missing permission in channel ${plugin.channelId}`);
    }

    const word = await getRandomWord();
    if (!word) return console.warn("[WOTD] No word available");

    const message = `📖 **Word of the Day**
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
    console.log(`[WOTD] ✅ Sent to guild ${guildId} channel ${plugin.channelId}`);
  } catch (err) {
    console.error("🔥 Error sending WOTD:", err);
  }
}

module.exports = { getRandomWord, sendWOTDNow };
