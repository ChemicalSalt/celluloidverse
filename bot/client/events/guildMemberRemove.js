module.exports = (client) => {
  client.on("guildMemberRemove", async (member) => {
    try {
      const { db } = require("../../utils/firestore");
      const doc = await db.collection("guilds").doc(member.guild.id).get();
      const plugin = doc.exists ? doc.data()?.plugins?.farewell : null;
      if (!plugin) return;

      const farewellHandler = require("../../plugins/farewell"); // <- correct path
      await farewellHandler.handleFarewell(member, plugin);
    } catch (err) {
      console.error("[guildMemberRemove] error:", err);
    }
  });
};
