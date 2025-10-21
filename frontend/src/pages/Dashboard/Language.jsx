import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { sanitizeDynamic } from "../../utils/sanitize";
import moment from "moment-timezone";
import TimePicker from 'react-time-picker';
const Language = () => {
  const { serverId } = useParams();
  const [channels, setChannels] = useState([]);
  const [settings, setSettings] = useState({
    channelId: "",
    time: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    language: "",
    enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const fetchChannels = async () => {
      if (!serverId) return;
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/dashboard/servers/${serverId}/channels`,
          { credentials: "include" }
        );
        const data = await res.json();
        setChannels(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchChannels();
  }, [serverId]);

  const calculateUtcTime = (localTime, timezone) => {
    try {
      const now = new Date();
      const [hours, minutes] = localTime.split(":").map(Number);
      const local = new Date(now);
      local.setHours(hours, minutes, 0, 0);
      const utc = new Date(local.toLocaleString("en-US", { timeZone: "UTC" }));
      const tzOffset = local.getTime() - utc.getTime();
      const utcTime = new Date(local.getTime() - tzOffset);
      return utcTime.toISOString().substring(11, 16);
    } catch {
      return null;
    }
  };

  const handleSave = async () => {
    if (!settings.channelId || !settings.time || !settings.language || !settings.timezone) {
      setSaveMessage("Please select a channel, time, language, and timezone");
      return setTimeout(() => setSaveMessage(""), 3000);
    }

    try {
      const utcTime = calculateUtcTime(settings.time, settings.timezone);
      const payload = {
        channelId: sanitizeDynamic(settings.channelId),
        time: sanitizeDynamic(settings.time),
        language: sanitizeDynamic(settings.language),
        enabled: settings.enabled,
        timezone: sanitizeDynamic(settings.timezone),
        utcTime,
      };

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/dashboard/servers/${serverId}/plugins/language`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (data.success) {
        setSaveMessage("✅ Saved successfully!");
        setSettings({
          channelId: "",
          time: "",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          language: "",
          enabled: true,
        });
      } else {
        setSaveMessage("❌ Failed to save settings");
      }
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setSaveMessage("⚠️ Error saving settings");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-lg text-zinc-600 dark:text-zinc-400 bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-100 dark:from-black dark:via-zinc-900/70 dark:to-black">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen px-6 py-16 bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-100 dark:from-black dark:via-zinc-900/70 dark:to-black transition-colors duration-700 text-zinc-900 dark:text-zinc-100">
      <div className="max-w-3xl mx-auto text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">
          <span className="bg-gradient-to-r from-zinc-400 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Language Plugin
          </span>
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Schedule daily word updates in your preferred language and time zone.
        </p>
      </div>

      <div className="max-w-2xl mx-auto p-8 rounded-2xl shadow-lg border border-zinc-300/40 dark:border-zinc-700/40 bg-zinc-100/70 dark:bg-zinc-900/70 backdrop-blur-sm flex flex-col gap-6 transition-all duration-300">
        
        {/* Channel */}
        <div>
          <label className="block mb-2 font-medium">Select a channel</label>
          <select
            value={settings.channelId}
            onChange={(e) => setSettings({ ...settings, channelId: e.target.value })}
            className="w-full p-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-black dark:text-white focus:ring-2 focus:ring-zinc-500 outline-none transition-all duration-300"
          >
            <option value="">-- Select a channel --</option>
            {channels.map((ch) => (
              <option key={ch.id} value={ch.id}>
                #{ch.name}
              </option>
            ))}
          </select>
        </div>

        {/* Time */}
        <div>
          <label className="block mb-2 font-medium">Time (24-hour)</label>
          <input
            type="time"
            value={settings.time}
            onChange={(e) => setSettings({ ...settings, time: e.target.value })}
            step="60"
            className="w-full p-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-black text-black dark:text-white focus:ring-2 focus:ring-zinc-500 outline-none transition-all duration-300"
          />
        </div>

        {/* Timezone */}
        <div>
          <label className="block mb-2 font-medium">Select a timezone</label>
          <select
            value={settings.timezone}
            onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
            className="w-full p-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400 transition-all duration-300"
          >
            <option value="">-- Select a timezone --</option>
            {moment.tz.names().map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        {/* Language */}
        <div>
          <label className="block mb-2 font-medium">Select a language</label>
          <select
            value={settings.language}
            onChange={(e) => setSettings({ ...settings, language: e.target.value })}
            className="w-full p-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400 transition-all duration-300"
          >
            <option value="">-- Select a language --</option>
            <option value="japanese">Japanese</option>
            <option value="english">English</option>
            <option value="mandarin">Mandarin</option>
            <option value="hindi">Hindi</option>
            <option value="arabic">Arabic</option>
          </select>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="px-6 py-3 rounded-full font-semibold bg-black text-white dark:bg-white dark:text-black hover:scale-105 hover:shadow-[0_0_25px_rgba(255,255,255,0.1)] dark:hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] transition-all duration-300"
        >
          Save
        </button>

        {saveMessage && (
          <div
            className={`mt-3 text-center font-medium ${
              saveMessage.includes("Please") ||
              saveMessage.includes("Error") ||
              saveMessage.includes("Failed")
                ? "text-red-600 dark:text-red-400"
                : "text-green-600 dark:text-green-400"
            }`}
          >
            {saveMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default Language;
