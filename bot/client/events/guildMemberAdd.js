const { handleWelcome } = require("../../plugins/welcome");

module.exports = {
  name: "guildMemberAdd",
  async execute(client, member) {
    try {
      const doc = await client.db.collection("guilds").doc(member.guild.id).get();
      await handleWelcome(member, doc.data()?.plugins?.welcome);
    } catch (err) {
      console.error(err);
    }
  },
};
