const { handleFarewell } = require("../../plugins/farewell");

module.exports = {
  name: "guildMemberRemove",
  async execute(member) {
    const pluginsDoc = (await member.client.db.collection("guilds").doc(member.guild.id).get()).data()?.plugins || {};
    if (pluginsDoc.farewell) {
      await handleFarewell(member, pluginsDoc.farewell);
    }
  },
};
