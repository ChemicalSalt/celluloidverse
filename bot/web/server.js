const express = require("express");
const config = require("../config/botConfig");

const app = express();
app.use(express.json());

app.get("/", (_req, res) => res.send("Bot is alive"));

function startServer() {
  const port = config.PORT;
  app.listen(port, "0.0.0.0", () => {
    console.log(`🌐 Web server running on port ${port}`);
  });
}

module.exports = { startServer };
