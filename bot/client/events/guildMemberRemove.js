const { formatMessage } = require("../../utils/helpers");
const db = require("../../utils/firestore"); // assuming you export admin.firestore() here

module.exports = {
  name: "guildMemberRemove",
  async execute(member) {
    try {
      const doc = await db.collection("guilds").doc(member.guild.id).get();
      const plugin = doc.data()?.plugins?.farewell;
      if (!plugin || !plugin.enabled) return;

      // Send in server
      if (plugin.sendInServer && plugin.serverMessage && plugin.channelId) {
        const channel =
          member.guild.channels.cache.get(plugin.channelId) ||
          (await member.guild.channels.fetch(plugin.channelId).catch(() => null));
        if (channel?.permissionsFor(member.guild.members.me)?.has("SendMessages")) {
          const msg = formatMessage(plugin.serverMessage, member, member.guild);
          await channel.send(msg).catch(console.error);
        }
      }

      // Send in DM
      if (plugin.sendInDM && plugin.dmMessage) {
        await member.send(formatMessage(plugin.dmMessage, member, member.guild)).catch(() => {});
      }
    } catch (err) {
      console.error("🔥 guildMemberRemove handler error:", err);
    }
  },
};
