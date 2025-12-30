// bot/cron/messageScheduler.js

const cron = require("node-cron");
const { db } = require("../utils/firestore");
const { client } = require("../client/client");
const { EmbedBuilder } = require("discord.js");

console.log("📅 Message Scheduler cron started - runs every minute");

// Run every minute
cron.schedule("* * * * *", async () => {
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const currentTime = now.toTimeString().split(' ')[0].slice(0, 5); // HH:MM

  console.log(`[Scheduler Check] ${currentDate} ${currentTime}`);

  try {
    const snap = await db
      .collection("scheduledMessages")
      .where("sent", "==", false)
      .where("date", "==", currentDate)
      .get();

    if (snap.empty) {
      console.log("No scheduled messages for today");
      return;
    }

    console.log(`Found ${snap.size} pending messages for today`);

    for (const doc of snap.docs) {
      const data = doc.data();
      
      // Check if the time matches (HH:MM format)
      if (data.time === currentTime) {
        console.log(`⏰ Sending scheduled message: ${doc.id}`);
        
        try {
          const channel = await client.channels.fetch(data.channelId);
          
          if (channel && channel.isTextBased()) {
            const guild = channel.guild;
            
            // IMPORTANT: Fetch all members first
            await guild.members.fetch();
            
            console.log(`🔍 Original message: ${data.message}`);
            
            // Extract GIF URLs first (before other replacements)
            const gifMatches = [...data.message.matchAll(/{gif:([^}]+)}/g)];
            const gifUrls = gifMatches.map(match => match[1].trim());
            
            // Replace basic placeholders
            let finalMessage = data.message
              .replace(/{server}/g, guild.name)
              .replace(/{everyone}/g, '@everyone')
              .replace(/{here}/g, '@here')
              .replace(/{gif:[^}]+}/g, ''); // Remove {gif:...} from text
            
            console.log(`🔍 After basic replacements: ${finalMessage}`);
            
            // Replace {channel:ChannelName} with proper channel mention
            finalMessage = finalMessage.replace(/{channel:([^}]+)}/g, (match, channelName) => {
              const targetChannel = guild.channels.cache.find(ch => 
                ch.name.toLowerCase() === channelName.toLowerCase()
              );
              if (targetChannel) {
                console.log(`✅ Found channel: ${channelName} → <#${targetChannel.id}>`);
                return `<#${targetChannel.id}>`;
              } else {
                console.log(`❌ Channel not found: ${channelName}`);
                return match;
              }
            });
            
            // Replace {role:RoleName} with proper role mention
            finalMessage = finalMessage.replace(/{role:([^}]+)}/g, (match, roleName) => {
              const role = guild.roles.cache.find(r => 
                r.name.toLowerCase() === roleName.toLowerCase()
              );
              if (role) {
                console.log(`✅ Found role: ${roleName} → <@&${role.id}>`);
                return `<@&${role.id}>`;
              } else {
                console.log(`❌ Role not found: ${roleName}`);
                return match;
              }
            });
            
            // Replace {user:Username} with username text (no ping)
            finalMessage = finalMessage.replace(/{user:([^}]+)}/g, (match, userName) => {
              const member = guild.members.cache.find(m => 
                m.user.username.toLowerCase() === userName.toLowerCase() ||
                m.user.tag.toLowerCase() === userName.toLowerCase() ||
                m.displayName.toLowerCase() === userName.toLowerCase()
              );
              if (member) {
                console.log(`✅ Found user (no ping): ${userName} → ${member.user.username}`);
                return member.user.username;
              } else {
                console.log(`❌ User not found: ${userName}`);
                return match;
              }
            });
            
            // Replace {usermention:Username} with proper user mention (ping)
            finalMessage = finalMessage.replace(/{usermention:([^}]+)}/g, (match, userName) => {
              const member = guild.members.cache.find(m => 
                m.user.username.toLowerCase() === userName.toLowerCase() ||
                m.user.tag.toLowerCase() === userName.toLowerCase() ||
                m.displayName.toLowerCase() === userName.toLowerCase()
              );
              if (member) {
                console.log(`✅ Found user (with ping): ${userName} → <@${member.id}>`);
                return `<@${member.id}>`;
              } else {
                console.log(`❌ User not found for mention: ${userName}`);
                return match;
              }
            });
            
            console.log(`🔍 Final message: ${finalMessage}`);
            console.log(`🎬 GIFs found: ${gifUrls.length}`);
            
            // Prepare message payload
            const messagePayload = {
              content: finalMessage.trim(),
              allowedMentions: { parse: ['everyone', 'roles', 'users'] }
            };
            
            // Add GIF embeds if any
            if (gifUrls.length > 0) {
              messagePayload.embeds = gifUrls.map(url => {
                console.log(`✅ Adding GIF: ${url}`);
                return new EmbedBuilder().setImage(url).setColor(0xFFFFFF);
              });
            }
            
            // Send message
            await channel.send(messagePayload);
            console.log(`✅ Message sent to #${channel.name}`);
            
            // Mark as sent
            await doc.ref.update({
              sent: true,
              sentAt: new Date(),
            });
          } else {
            console.error(`❌ Channel ${data.channelId} not found or not text-based`);
          }
        } catch (err) {
          console.error(`❌ Failed to send message ${doc.id}:`, err.message);
        }
      }
    }
  } catch (err) {
    console.error("[MessageScheduler] Cron error:", err);
  }
});