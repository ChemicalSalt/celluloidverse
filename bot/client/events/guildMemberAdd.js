module.exports = (client) => {
  client.on("guildMemberAdd", async (member) => {
    try {
      const { db } = require("../../utils/firestore");
      const doc = await db.collection("guilds").doc(member.guild.id).get();
      const plugin = doc.exists ? doc.data()?.plugins?.welcome : null;
      if (!plugin) return;

      const welcomeHandler = require("../../plugins/welcome"); // <- correct path
      await welcomeHandler.handleWelcome(member, plugin);
    } catch (err) {
      console.error("[guildMemberAdd] error:", err);
    }
  });
};
