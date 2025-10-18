// bot/config/botConfig.js

// Common realistic timezones (max 25)
const commonTimezones = [
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Dubai",
  "Asia/Singapore",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "America/Mexico_City",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Africa/Johannesburg",
  "Africa/Cairo",
  "Pacific/Auckland",
  "Pacific/Honolulu",
  "Asia/Seoul",
  "Asia/Bangkok",
  "Asia/Jakarta",
];

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
        { name: "time", type: 3, description: "HH:MM 24h format (Local time)", required: true },
        { 
          name: "timezone", 
          type: 3, 
          description: "Your timezone (e.g., Asia/Kolkata)", 
          required: true,
          choices: commonTimezones.map(tz => ({ name: tz, value: tz })) // Add choices
        },
        { 
          name: "language", 
          type: 3, 
          description: "Pick language", 
          required: true, 
          choices: [
            { name: "Japanese", value: "japanese" },
            { name: "English", value: "english" },
            { name: "Mandarin", value: "mandarin" },
            { name: "Hindi", value: "hindi" },
            { name: "Arabic", value: "arabic" }
          ] 
        },
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
