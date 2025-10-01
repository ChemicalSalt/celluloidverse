const { formatMessage } = require("../utils/helpers");

async function handleWelcome(member, plugin) {
  if (!plugin || !plugin.enabled) return;

  try {
    const botMember = member.guild.members.me || await member.guild.members.fetch(member.guild.client.user.id);

    if (plugin.sendInServer && plugin.serverMessage && plugin.channelId) {
      const ch = member.guild.channels.cache.get(plugin.channelId) || await member.guild.channels.fetch(plugin.channelId).catch(() => null);
      if (ch && ch.permissionsFor(botMember)?.has("SendMessages")) {
        const msg = formatMessage(plugin.serverMessage, member, member.guild);
        await ch.send(msg).catch(e => console.error("[Welcome] server send error:", e));
      }
    }

    if (plugin.sendInDM && plugin.dmMessage) {
      const dm = formatMessage(plugin.dmMessage, member, member.guild);
      await member.send(dm).catch(() => {});
    }
  } catch (err) {
    console.error("[Welcome] error:", err);
  }
}

module.exports = { handleWelcome };
