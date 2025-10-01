// helpers.js
function cleanChannelId(id) {
  if (!id) return null;
  return id.replace(/[^0-9]/g, "");
}

module.exports = { cleanChannelId };
