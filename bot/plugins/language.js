// client/plugins/language.js
const { getRandomWordFromSheet } = require("../utils/sheets");
const { db } = require("../utils/firestore");

async function sendWOTDNow(guildId, plugin) {
  try {
    if (!plugin || !plugin.enabled) return;
    const client = require("../client").client;
    const guild = client.guilds.cache.get(guildId) || (await client.guilds.fetch(guildId).catch(() => null));
    if (!guild) return console.warn(`[WOTD] Guild not found: ${guildId}`);

    const channel =
      guild.channels.cache.get(plugin.channelId) || (await guild.channels.fetch(plugin.channelId).catch(() => null));
    if (!channel) return console.warn(`[WOTD] Channel not found: ${plugin.channelId}`);

    const me = guild.members.me || (await guild.members.fetch(client.user.id).catch(() => null));
    if (!me || !channel.permissionsFor(me)?.has("SendMessages")) {
      return console.warn(`[WOTD] Missing send permission in ${plugin.channelId}`);
    }

    const word = await getRandomWordFromSheet();
    if (!word) return console.warn("[WOTD] No word fetched from sheet");

    const message = `📖 **Word of the Day**
**Kanji:** ${word.kanji}
**Hiragana/Katakana:** ${word.hiragana}
**Romaji:** ${word.romaji}
**Meaning:** ${word.meaning}

📌 **Example Sentence**
**JP:** ${word.sentenceJP || "—"}
**Hiragana/Katakana:** ${word.sentenceHiragana || "—"}
**Romaji:** ${word.sentenceRomaji || "—"}
**English:** ${word.sentenceMeaning || "—"}`;

    await channel.send(message);
    console.log(`[WOTD] Sent to guild ${guildId} channel ${plugin.channelId}`);
  } catch (err) {
    console.error("[WOTD] send error:", err);
  }
}

module.exports = { sendWOTDNow };
