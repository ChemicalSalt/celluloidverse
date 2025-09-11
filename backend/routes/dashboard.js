const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const { db } = require("../firebase");

// ---- Get user's servers ----
router.get("/servers", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const userData = await userRes.json();

    const guildRes = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const guilds = await guildRes.json();

    // Check which servers have the bot
    const results = await Promise.all(
      guilds.map(async (guild) => {
        const doc = await db.collection("guilds").doc(guild.id).get();
        return {
          id: guild.id,
          name: guild.name,
          icon: guild.icon,
          hasBot: doc.exists,
        };
      })
    );

    res.json(results);
  } catch (err) {
    console.error("Failed to fetch servers:", err);
    res.status(500).json({ error: "Failed to fetch servers" });
  }
});

// ---- Get channels for a server ----
router.get("/servers/:id/channels", async (req, res) => {
  const { id } = req.params;

  try {
    const guildDoc = await db.collection("guilds").doc(id).get();
    if (!guildDoc.exists) return res.json([]);

    const botToken = process.env.BOT_TOKEN;
    const response = await fetch(`https://discord.com/api/guilds/${id}/channels`, {
      headers: { Authorization: `Bot ${botToken}` },
    });
    const data = await response.json();

    // Only return text channels
    const textChannels = data.filter((c) => c.type === 0).map((c) => ({
      id: c.id,
      name: c.name,
    }));

    res.json(textChannels);
  } catch (err) {
    console.error("Failed to fetch channels:", err);
    res.status(500).json({ error: "Failed to fetch channels" });
  }
});

// ---- Get saved messages/settings ----
router.get("/servers/:id/messages", async (req, res) => {
  const { id } = req.params;

  try {
    const doc = await db.collection("guilds").doc(id).get();
    if (!doc.exists) return res.json({ plugins: {} });

    res.json(doc.data());
  } catch (err) {
    console.error("Failed to fetch messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// ---- Save messages/settings for a server ----
router.post("/servers/:id/messages", async (req, res) => {
  const { id } = req.params;
  const { welcome, farewell } = req.body;

  try {
    const docRef = db.collection("guilds").doc(id);
    const doc = await docRef.get();
    const currentData = doc.data() || {};

    await docRef.set(
      {
        plugins: {
          welcome: {
            serverEnabled:
              welcome?.serverEnabled ??
              currentData.plugins?.welcome?.serverEnabled ??
              false,
            channelId:
              welcome?.channelId ??
              currentData.plugins?.welcome?.channelId ??
              null,
            serverMessage:
              welcome?.serverMessage ??
              currentData.plugins?.welcome?.serverMessage ??
              "",
            dmEnabled:
              welcome?.dmEnabled ??
              currentData.plugins?.welcome?.dmEnabled ??
              false,
            dmMessage:
              welcome?.dmMessage ??
              currentData.plugins?.welcome?.dmMessage ??
              "",
          },
          farewell: {
            serverEnabled:
              farewell?.serverEnabled ??
              currentData.plugins?.farewell?.serverEnabled ??
              false,
            channelId:
              farewell?.channelId ??
              currentData.plugins?.farewell?.channelId ??
              null,
            serverMessage:
              farewell?.serverMessage ??
              currentData.plugins?.farewell?.serverMessage ??
              "",
            dmEnabled:
              farewell?.dmEnabled ??
              currentData.plugins?.farewell?.dmEnabled ??
              false,
            dmMessage:
              farewell?.dmMessage ??
              currentData.plugins?.farewell?.dmMessage ??
              "",
          },
        },
      },
      { merge: true }
    );

    console.log(`Saved messages for server ${id} to Firestore`);
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to save messages:", err);
    res.status(500).json({ error: "Failed to save messages" });
  }
});

module.exports = router;
