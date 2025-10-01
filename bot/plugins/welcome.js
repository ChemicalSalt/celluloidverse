const { formatMessage } = require("../../utils/helpers");

async function handleWelcome(member, plugin) {
  if (!plugin || !plugin.enabled) return;
  try {
    if (plugin.sendInServer && plugin.serverMessage && plugin.channelId) {
      const ch =
        member.guild.channels.cache.get(plugin.channelId) ||
        (await member.guild.channels.fetch(plugin.channelId).catch(() => null));
      if (ch && ch.permissionsFor(member.guild.members.me)?.has("SendMessages")) {
        await ch.send(formatMessage(plugin.serverMessage, member, member.guild));
      }
    }
    if (plugin.sendInDM && plugin.dmMessage) {
      await member.send(formatMessage(plugin.dmMessage, member, member.guild)).catch(() => {});
    }
  } catch (err) {
    console.error("[Welcome] error:", err);
  }
}

module.exports = { handleWelcome };
