// web/server.js
const express = require("express");
const { stopAll } = require("../cron/scheduler");

const app = express();
app.use(express.json());

app.get("/", (_req, res) => res.send("Bot is alive"));

app.post("/shutdown", async (req, res) => {
  // basic protection by token header
  const token = req.headers["x-admin-token"];
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    return res.status(403).send("forbidden");
  }
  try {
    stopAll();
    res.send("shutting down cron jobs");
    // process exit intentionally not called here to avoid abrupt stop
  } catch (err) {
    res.status(500).send("error stopping");
  }
});

function start() {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 Web server listening on ${PORT}`);
  });
}

module.exports = { start, app };
