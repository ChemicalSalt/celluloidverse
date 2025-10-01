module.exports = (app) => {
  app.get("/", (_req, res) => res.send("Bot is alive"));
};
