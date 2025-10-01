// client/plugins/farewell.js
const { formatMessage } = require("../../utils/helpers");

async function handleFarewell(member, plugin) {
  if (!plugin || !plugin.enabled) return;
  try {
    if (plugin.sendInServer && plugin.serverMessage && plugin.channelId) {
      const ch =
        member.guild.channels.cache.get(plugin.channelId) ||
        (await member.guild.channels.fetch(plugin.channelId).catch(() => null));
      if (ch && ch.permissionsFor(member.guild.members.me)?.has("SendMessages")) {
        const msg = formatMessage(plugin.serverMessage, member, member.guild);
        await ch.send(msg).catch((e) => console.error("[Farewell] server send error:", e));
      } else {
        console.warn(`[Farewell] cannot send in server channel ${plugin.channelId}`);
      }
    }

    if (plugin.sendInDM && plugin.dmMessage) {
      const dm = formatMessage(plugin.dmMessage, member, member.guild);
      await member.send(dm).catch(() => {});
    }
  } catch (err) {
    console.error("[Farewell] error:", err);
  }
}

module.exports = { handleFarewell };
