// utils/sanitize.js
/**
 * Sanitize dynamic content (usernames, guild names, Google Sheets content)
 * Keeps Markdown characters (*, _, ~) intact for templates
 * Blocks @everyone/@here and user/role mentions, backticks
 */
function sanitizeDynamic(text, { maxLen = 200 } = {}) {
  if (!text) return "";
  text = String(text);

  if (text.length > maxLen) text = text.slice(0, maxLen - 1) + "…";
  text = text.replace(/[\u200B-\u200F\uFEFF]/g, ""); // zero-width/control chars
  text = text.replace(/@(everyone|here)/gi, "@\u200b$1"); // block mass mentions
  text = text.replace(/<@!?(\d+)>/g, "<@\u200b$1>");     // block user mentions
  text = text.replace(/<@&(\d+)>/g, "<@&\u200b$1>");     // block role mentions
  text = text.replace(/`/g, "'");                        // prevent code injection

  return text;
}

module.exports = { sanitizeDynamic };
