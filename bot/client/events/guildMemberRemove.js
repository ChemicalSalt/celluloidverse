const { db } = require("../../utils/firestore");
const { handleFarewell } = require("../../plugins/farewell");

module.exports = async (member) => {
  try {
    const doc = await db.collection("guilds").doc(member.guild.id).get();
    await handleFarewell(member, doc.data()?.plugins?.farewell);
  } catch (err) {
    console.error(err);
  }
};
