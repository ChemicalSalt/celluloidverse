const { formatMessage } = require("../utils/helpers");

// Sanitize dynamic content to prevent mentions or markdown injection
function sanitizeDiscord(text) {
  if (!text) return "";
  return text
    .replace(/@/g, "@\u200b")   // prevent mentions
    .replace(/`/g, "'")         // prevent code block injection
    .replace(/\*/g, "\\*")      // escape bold/italic
    .replace(/_/g, "\\_")       // escape underline/italic
    .replace(/~/g, "\\~");      // escape strikethrough
}

async function handleWelcome(member, plugin) {
  if (!plugin || !plugin.enabled) return;

  try {
    const botMember = member.guild.members.me || await member.guild.members.fetch(member.guild.client.user.id);

    // Send welcome in server
    if (plugin.sendInServer && plugin.serverMessage && plugin.channelId) {
      const ch = member.guild.channels.cache.get(plugin.channelId) || await member.guild.channels.fetch(plugin.channelId).catch(() => null);
      if (ch && ch.permissionsFor(botMember)?.has("SendMessages")) {
        let msg = formatMessage(plugin.serverMessage, member, member.guild);
        msg = sanitizeDiscord(msg);
        await ch.send(msg).catch(e => console.error("[Welcome] server send error:", e));
      }
    }

    // Send welcome via DM
    if (plugin.sendInDM && plugin.dmMessage) {
      let dm = formatMessage(plugin.dmMessage, member, member.guild);
      dm = sanitizeDiscord(dm);
      await member.send(dm).catch(() => {});
    }
  } catch (err) {
    console.error("[Welcome] error:", err);
  }
}

module.exports = { handleWelcome };
