const { handleWelcome } = require("../../plugins/welcome");

module.exports = async (member) => {
  try {
    const doc = await member.client.db.collection("guilds").doc(member.guild.id).get();
    await handleWelcome(member, doc.data()?.plugins?.welcome);
  } catch (err) {
    console.error(err);
  }
};
