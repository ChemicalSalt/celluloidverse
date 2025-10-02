const { formatMessage } = require("../utils/helpers");
const { sanitizeDynamic } = require("../utils/sanitize");

async function handleFarewell(member, plugin) {
  if (!plugin?.enabled) return;

  try {
    const botMember = member.guild.members.me || await member.guild.members.fetch(member.guild.client.user.id);

    const sanitizeMsg = (msg) => msg
      .replace("{user}", sanitizeDynamic(member.displayName))
      .replace("{userTag}", sanitizeDynamic(`${member.user.username}#${member.user.discriminator}`))
      .replace("{server}", sanitizeDynamic(member.guild.name));

    if (plugin.sendInServer && plugin.serverMessage && plugin.channelId) {
      const ch = member.guild.channels.cache.get(plugin.channelId) || await member.guild.channels.fetch(plugin.channelId).catch(() => null);
      if (ch && ch.permissionsFor(botMember)?.has("SendMessages")) {
        let msg = formatMessage(plugin.serverMessage, member, member.guild);
        msg = sanitizeMsg(msg);
        await ch.send({ content: msg, allowedMentions: { parse: [] } })
          .catch(e => console.error("[Farewell] server send error:", e));
      }
    }

    if (plugin.sendInDM && plugin.dmMessage) {
      let dm = formatMessage(plugin.dmMessage, member, member.guild);
      dm = sanitizeMsg(dm);
      await member.send({ content: dm, allowedMentions: { parse: [] } }).catch(() => {});
    }

  } catch (err) {
    console.error("[Farewell] error:", err);
  }
}

module.exports = { handleFarewell };
