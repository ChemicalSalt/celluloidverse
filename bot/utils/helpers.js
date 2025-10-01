function cleanChannelId(id) {
  if (!id) return null;
  return id.replace(/[^0-9]/g, "");
}

function formatMessage(msg, member, guild) {
  if (!msg) return "";
  return msg
    .replaceAll("{username}", member.user.username)
    .replaceAll("{usermention}", `<@${member.id}>`)
    .replaceAll("{server}", guild.name)
    .replace(/\{role:([^\}]+)\}/g, (_, r) => {
      const role = guild.roles.cache.find((x) => x.name === r);
      return role ? `<@&${role.id}>` : r;
    })
    .replace(/\{channel:([^\}]+)\}/g, (_, c) => {
      const ch = guild.channels.cache.find((x) => x.name === c);
      return ch ? `<#${ch.id}>` : c;
    });
}

module.exports = { cleanChannelId, formatMessage };
