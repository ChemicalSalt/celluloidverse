// client/events/guildMemberRemove.js
module.exports = {
  name: "guildMemberRemove",
  once: false,
  execute: async (client, member) => {
    try {
      const doc = await client.db.collection("guilds").doc(member.guild.id).get();
      const farewell = doc.exists ? (doc.data()?.plugins?.farewell) : null;
      if (!farewell) return;
      const farewellPlugin = require("../../plugins/farewell");
      if (typeof farewellPlugin === "function") {
        try {
          farewellPlugin(client, { db: client.db, helpers: client.helpers });
        } catch {}
      }
      if (farewellPlugin && farewellPlugin.handleFarewell) {
        await farewellPlugin.handleFarewell(member, farewell);
      }
    } catch (err) {
      console.error("🔥 guildMemberRemove handler error:", err);
    }
  },
};
