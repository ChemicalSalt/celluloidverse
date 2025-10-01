function formatMessage(msg, member) {
  if (!msg) return "";
  return msg
    .replaceAll("{username}", member.user.username)
    .replaceAll("{usermention}", `<@${member.id}>`)
    .replaceAll("{server}", member.guild.name)
    .replace(/\{role:([^\}]+)\}/g, (_, r) => {
      const role = member.guild.roles.cache.find(x => x.name === r);
      return role ? `<@&${role.id}>` : r;
    })
    .replace(/\{channel:([^\}]+)\}/g, (_, c) => {
      const ch = member.guild.channels.cache.find(x => x.name === c);
      return ch ? `<#${ch.id}>` : c;
    });
}

async function handleFarewell(member, plugin) {
  if (!plugin?.enabled) return;

  if (plugin.sendInServer && plugin.serverMessage && plugin.channelId) {
    const ch = member.guild.channels.cache.get(plugin.channelId) ||
      await member.guild.channels.fetch(plugin.channelId).catch(() => null);
    if (ch?.permissionsFor(member.guild.members.me)?.has("SendMessages")) {
      await ch.send(formatMessage(plugin.serverMessage, member)).catch(() => {});
    }
  }

  if (plugin.sendInDM && plugin.dmMessage) {
    await member.send(formatMessage(plugin.dmMessage, member)).catch(() => {});
  }
}

module.exports = { handleFarewell };
