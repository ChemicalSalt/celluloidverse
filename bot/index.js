const welcome = data.plugins?.welcome;
if (!welcome) return;

// Server welcome
if (welcome.serverEnabled && welcome.serverMessage && welcome.channelId) {
  const channel = member.guild.channels.cache.get(welcome.channelId);
  if (channel) {
    const msg = parsePlaceholders(welcome.serverMessage, member);
    channel.send(msg);
  }
}

// DM welcome
if (welcome.dmEnabled && welcome.dmMessage) {
  const msg = parsePlaceholders(welcome.dmMessage, member);
  member.send(msg).catch(() => {});
}
