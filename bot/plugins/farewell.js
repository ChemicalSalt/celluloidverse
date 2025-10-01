const { handleFarewell } = require("./welcome"); // same as welcome logic
async function handleFarewell(member, plugin) {
  if (!plugin?.enabled) return;

  if (plugin.sendInServer && plugin.serverMessage && plugin.channelId) {
    const ch = member.guild.channels.cache.get(plugin.channelId) ||
      await member.guild.channels.fetch(plugin.channelId).catch(() => null);
    if (ch?.permissionsFor(member.guild.members.me)?.has("SendMessages")) {
      await ch.send(plugin.serverMessage.replaceAll("{username}", member.user.username)).catch(() => {});
    }
  }

  if (plugin.sendInDM && plugin.dmMessage) {
    await member.send(plugin.dmMessage.replaceAll("{username}", member.user.username)).catch(() => {});
  }
}

module.exports = { handleFarewell };
