const { handleFarewell } = require("../../plugins/farewell");

module.exports = {
  name: "guildMemberRemove",
  async execute(client, member) {
    try {
      const doc = await client.db.collection("guilds").doc(member.guild.id).get();
      await handleFarewell(member, doc.data()?.plugins?.farewell);
    } catch (err) {
      console.error(err);
    }
  },
};
