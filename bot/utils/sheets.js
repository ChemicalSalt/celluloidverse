// utils/sheets.js
// Thin wrapper over google sheets client usage used by plugins.

module.exports = {
  async getAllRows(sheetsClient, spreadsheetId, range) {
    try {
      const clientAuth = await sheetsClient.context ? sheetsClient.context._options : null;
      // sheetsClient is already created with auth in config/sheetsConfig
      const res = await sheetsClient.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
      return res.data.values || [];
    } catch (err) {
      console.error("🔥 sheets.getAllRows error:", err);
      return [];
    }
  },
};
