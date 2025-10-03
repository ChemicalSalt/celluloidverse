// src/utils/sanitize.js

/**
 * Sanitize user input for frontend forms before sending to Firestore
 * - Removes dangerous mentions
 * - Keeps basic Markdown (*, _, ~) intact
 * - Prevents backticks/code injection
 */
export function sanitizeDynamic(text, { maxLen = 500 } = {}) {
  if (!text) return "";
  text = String(text);

  // Truncate if too long
  if (text.length > maxLen) text = text.slice(0, maxLen - 1) + "…";

  // Remove zero-width / control characters
  text = text.replace(/[\u200B-\u200F\uFEFF]/g, "");

  // Block mass mentions
  text = text.replace(/@(everyone|here)/gi, "@\u200b$1");

  // Block user/role mentions
  text = text.replace(/<@!?(\d+)>/g, "<@\u200b$1>");
  text = text.replace(/<@&(\d+)>/g, "<@&\u200b$1>");

  // Prevent code injection via backticks
  text = text.replace(/`/g, "'");

  return text.trim();
}
