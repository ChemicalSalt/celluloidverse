const { handleWelcome } = require("../../plugins/welcome");

module.exports = {
  name: "guildMemberAdd",
  async execute(member) {
    const pluginsDoc = (await member.client.db.collection("guilds").doc(member.guild.id).get()).data()?.plugins || {};
    if (pluginsDoc.welcome) {
      await handleWelcome(member, pluginsDoc.welcome);
    }
  },
};
