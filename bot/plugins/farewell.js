// plugins/farewell.js
const helpers = require("../utils/helpers");

module.exports = (client, ctx = {}) => {
  client.plugins = client.plugins || {};
  client.plugins.farewell = client.plugins.farewell || {};
  client.plugins.farewell.handleFarewell = handleFarewell;
  return client.plugins.farewell;
};

async function handleFarewell(member, plugin) {
  if (!plugin?.enabled) return;
  try {
    if (plugin.sendInServer && plugin.serverMessage && plugin.channelId) {
      const msg = helpers.formatMessage(plugin.serverMessage, member, member.guild);
      const ch =
        member.guild.channels.cache.get(plugin.channelId) ||
        (await member.guild.channels.fetch(plugin.channelId).catch(() => null));
      if (ch?.permissionsFor(member.guild.members.me)?.has("SendMessages")) {
        await ch.send(msg).catch((e) => console.error("Farewell send error:", e));
      }
    }
    if (plugin.sendInDM && plugin.dmMessage) {
      await member.send(helpers.formatMessage(plugin.dmMessage, member, member.guild)).catch(() => {});
    }
  } catch (err) {
    console.error("🔥 handleFarewell error:", err);
  }
}

module.exports.handleFarewell = handleFarewell;
