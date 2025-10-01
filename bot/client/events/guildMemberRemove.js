const { handleFarewell } = require("../../plugins/welcome");

module.exports = async (member) => {
  try {
    const doc = await member.client.db.collection("guilds").doc(member.guild.id).get();
    await handleFarewell(member, doc.data()?.plugins?.farewell);
  } catch (err) {
    console.error(err);
  }
};
