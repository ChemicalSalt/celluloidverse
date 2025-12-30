const express = require("express");
const router = express.Router();
const { firestore } = require("../../firebase");

// POST route to save scheduled message
// Full path: /api/dashboard/servers/:serverId/scheduler
router.post("/:serverId/scheduler", async (req, res) => {
  console.log("✅ Scheduler POST hit:", req.params.serverId, req.body);
  
  const { serverId } = req.params;
  const { channelId, message, date, time } = req.body;

  // Validate required fields
  if (!serverId || !channelId || !message || !date || !time) {
    console.log("❌ Missing required fields");
    return res.status(400).json({ 
      success: false, 
      error: "Missing required fields: serverId, channelId, message, date, time" 
    });
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    console.log("❌ Invalid date format");
    return res.status(400).json({ 
      success: false,
      error: "Invalid date format. Use YYYY-MM-DD" 
    });
  }

  // Validate time format (HH:MM)
  const timeRegex = /^\d{2}:\d{2}$/;
  if (!timeRegex.test(time)) {
    console.log("❌ Invalid time format");
    return res.status(400).json({ 
      success: false,
      error: "Invalid time format. Use HH:MM (24-hour)" 
    });
  }

  try {
    const docRef = await firestore.collection("scheduledMessages").add({
      serverId,
      channelId,
      message,
      date,
      time,
      sent: false,
      createdAt: new Date(),
    });
    
    console.log("✅ Saved scheduled message with ID:", docRef.id);
    console.log("📅 Scheduled for:", `${date} at ${time}`);
    
    return res.json({ 
      success: true,
      messageId: docRef.id,
      scheduledFor: `${date} ${time}`
    });
  } catch (err) {
    console.error("❌ [Scheduler Save Error]", err);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to save to Firestore: " + err.message 
    });
  }
});

module.exports = router;