module.exports = {
  COMMANDS: [
    {
      name: "ping",
      description: "Check bot alive",
    },
    {
      name: "dashboard",
      description: "Open dashboard",
    },
    {
      name: "sendwotd",
      description: "Setup Word of the Day (Japanese only, UTC time)",
      options: [
        { name: "channel", type: 7, description: "Channel ID or #channel", required: true },
        { name: "time", type: 3, description: "HH:MM 24h format (UTC)", required: true },
        { name: "language", type: 3, description: "Pick language", required: true, choices: [{ name: "Japanese", value: "japanese" }] },
      ],
    },
    {
      name: "sendwelcome",
      description: "Setup Welcome message",
      options: [
        { name: "channel", type: 3, description: "Channel ID or #channel", required: true },
        { name: "send_in_server", type: 5, description: "Send in server?", required: true },
        { name: "send_in_dm", type: 5, description: "Send in DM?", required: true },
        { name: "servermessage", type: 3, description: "Server message", required: false },
        { name: "dmmessage", type: 3, description: "DM message", required: false },
      ],
    },
    {
      name: "sendfarewell",
      description: "Setup Farewell message",
      options: [
        { name: "channel", type: 7, description: "Channel ID or #channel", required: true },
        { name: "send_in_server", type: 5, description: "Send in server?", required: true },
        { name: "send_in_dm", type: 5, description: "Send in DM?", required: true },
        { name: "servermessage", type: 3, description: "Server message", required: false },
        { name: "dmmessage", type: 3, description: "DM message", required: false },
      ],
    },
  ],
};
