// client/events/guildMemberAdd.js
module.exports = {
  name: "guildMemberAdd",
  once: false,
  execute: async (client, member) => {
    try {
      const doc = await client.db.collection("guilds").doc(member.guild.id).get();
      const welcome = doc.exists ? (doc.data()?.plugins?.welcome) : null;
      if (!welcome) return;
      // plugins/welcome exports a handler when loaded, but we can require and call
      const welcomePlugin = require("../../plugins/welcome");
      if (typeof welcomePlugin === "function") {
        // plugin might be exported as a function wrapper; call it if not yet
        try {
          welcomePlugin(client, { db: client.db, helpers: client.helpers });
        } catch {}
      }
      if (welcomePlugin && welcomePlugin.handleWelcome) {
        await welcomePlugin.handleWelcome(member, welcome);
      } else if (typeof welcomePlugin === "function" && welcomePlugin.handleWelcome) {
        await welcomePlugin.handleWelcome(member, welcome);
      }
    } catch (err) {
      console.error("🔥 guildMemberAdd handler error:", err);
    }
  },
};
