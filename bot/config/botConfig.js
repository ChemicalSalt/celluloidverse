module.exports = {
  COMMANDS: [
    {
      name: "ping",
      description: "Ping Celluloidverse",
    },
    {
      name: "dashboard",
      description: "Open dashboard",
    },
    {
      name: "send_language",
      description: "Setup Word of the Day (Local time)",
      options: [
        { name: "channel", type: 7, description: "Channel ID or #channel", required: true },
        { name: "time", type: 3, description: "HH:MM 24h format (UTC)", required: true },
         { name: "timezone", type: 3, description: "Your timezone (e.g., Asia/Kolkata)", required: true },
        { name: "language", type: 3, description: "Pick language", required: true, choices: [{ name: "Japanese", value: "japanese" }] },
      ],
    },
    {
      name: "send_welcome",
      description: "Setup Welcome message",
      options: [
        { name: "channel", type: 7, description: "Channel ID or #channel", required: true },
        { name: "send_in_server", type: 5, description: "Send in server?", required: true },
        { name: "send_in_dm", type: 5, description: "Send in DM?", required: true },
        { name: "server_message", type: 3, description: "Server message", required: false },
        { name: "dm_message", type: 3, description: "DM message", required: false },
      ],
    },
    {
      name: "send_farewell",
      description: "Setup Farewell message",
      options: [
        { name: "channel", type: 7, description: "Channel ID or #channel", required: true },
        { name: "send_in_server", type: 5, description: "Send in server?", required: true },
        { name: "send_in_dm", type: 5, description: "Send in DM?", required: true },
        { name: "server_message", type: 3, description: "Server message", required: false },
        { name: "dm_message", type: 3, description: "DM message", required: false },
      ],
    },
  ],
};
