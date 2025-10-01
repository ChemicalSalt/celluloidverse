const { handleFarewell } = require("../../plugins/farewell");

module.exports = async (member) => {
  try {
    const doc = await member.client.db.collection("guilds").doc(member.guild.id).get();
    const plugin = doc.data()?.plugins?.farewell;
    await handleFarewell(member, plugin);
  } catch (err) {
    console.error("Farewell event error:", err);
  }
};
