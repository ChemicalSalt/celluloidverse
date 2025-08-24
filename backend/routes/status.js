const express = require("express");
const router = express.Router();
const db = require("../firebase"); // import the Firebase connection

router.get("/", async (req, res) => {
  try {
    const doc = await db.collection("botStatus").doc("main").get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Bot status not found" });
    }

    const statusData = doc.data();
    res.json({
      online: statusData.online,
      ping: statusData.ping,
      servers: statusData.servers,
      timestamp: statusData.timestamp
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch bot status" });
  }
});

module.exports = router;
