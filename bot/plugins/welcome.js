// client/plugins/welcome.js
const { formatMessage } = require("../../utils/helpers");

async function handleWelcome(member, plugin) {
  if (!plugin || !plugin.enabled) return;
  try {
    // send in server
    if (plugin.sendInServer && plugin.serverMessage && plugin.channelId) {
      const ch =
        member.guild.channels.cache.get(plugin.channelId) ||
        (await member.guild.channels.fetch(plugin.channelId).catch(() => null));
      if (ch && ch.permissionsFor(member.guild.members.me)?.has("SendMessages")) {
        const msg = formatMessage(plugin.serverMessage, member, member.guild);
        await ch.send(msg).catch((e) => console.error("[Welcome] server send error:", e));
      } else {
        console.warn(`[Welcome] cannot send in server channel ${plugin.channelId}`);
      }
    }

    // send DM
    if (plugin.sendInDM && plugin.dmMessage) {
      const dm = formatMessage(plugin.dmMessage, member, member.guild);
      await member.send(dm).catch(() => {
        // ignore DM failures (closed DMs)
      });
    }
  } catch (err) {
    console.error("[Welcome] error:", err);
  }
}

module.exports = { handleWelcome };
