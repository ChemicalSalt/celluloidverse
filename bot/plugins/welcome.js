// plugins/welcome.js
// Exposes handleWelcome(member, plugin) and also returns an initializer wrapper.
const helpers = require("../utils/helpers");

module.exports = (client, ctx = {}) => {
  // attach to client.plugins if provided
  client.plugins = client.plugins || {};
  client.plugins.welcome = client.plugins.welcome || {};
  client.plugins.welcome.handleWelcome = handleWelcome;
  return client.plugins.welcome;
};

async function handleWelcome(member, plugin) {
  if (!plugin?.enabled) return;
  try {
    if (plugin.sendInServer && plugin.serverMessage && plugin.channelId) {
      const msg = helpers.formatMessage(plugin.serverMessage, member, member.guild);
      const ch =
        member.guild.channels.cache.get(plugin.channelId) ||
        (await member.guild.channels.fetch(plugin.channelId).catch(() => null));
      if (ch?.permissionsFor(member.guild.members.me)?.has("SendMessages")) {
        await ch.send(msg).catch((e) => console.error("Welcome send error:", e));
      }
    }
    if (plugin.sendInDM && plugin.dmMessage) {
      await member.send(helpers.formatMessage(plugin.dmMessage, member, member.guild)).catch(() => {});
    }
  } catch (err) {
    console.error("🔥 handleWelcome error:", err);
  }
}

module.exports.handleWelcome = handleWelcome;
