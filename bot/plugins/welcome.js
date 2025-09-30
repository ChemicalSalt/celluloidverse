const { formatMessage } = require("../utils/helpers");

async function handleWelcome(member, plugin) {
  if (!plugin?.enabled) return;
  if (plugin.sendInServer && plugin.serverMessage && plugin.channelId) {
    const msg = formatMessage(plugin.serverMessage, member, member.guild);
    const ch = member.guild.channels.cache.get(plugin.channelId)
      || await member.guild.channels.fetch(plugin.channelId).catch(() => null);
    if (ch?.permissionsFor(member.guild.members.me)?.has("SendMessages")) {
      await ch.send(msg).catch((e) => console.error("Welcome send error:", e));
    }
  }
  if (plugin.sendInDM && plugin.dmMessage) {
    await member.send(formatMessage(plugin.dmMessage, member, member.guild)).catch(() => {});
  }
}

module.exports = { handleWelcome };
