const { handleWelcome } = require("../../plugins/welcome");

module.exports = async (member) => {
  try {
    const doc = await member.client.db.collection("guilds").doc(member.guild.id).get();
    const plugin = doc.data()?.plugins?.welcome;
    await handleWelcome(member, plugin);
  } catch (err) {
    console.error("Welcome event error:", err);
  }
};
