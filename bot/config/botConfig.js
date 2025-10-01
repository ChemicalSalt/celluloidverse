// config/botConfig.js
// Exports configuration values needed across the app.
// No heavy initialization here.

module.exports = {
  CLIENT_ID: process.env.CLIENT_ID,
  DASHBOARD_URL: process.env.DASHBOARD_URL,
  TOKEN: process.env.TOKEN,
  PORT: process.env.PORT || 3000,
};
