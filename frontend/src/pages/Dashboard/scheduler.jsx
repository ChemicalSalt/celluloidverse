import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { sanitizeDynamic } from "../../utils/sanitize";

const Scheduler = () => {
  const { serverId } = useParams();

  const [channels, setChannels] = useState([]);
  const [settings, setSettings] = useState({
    channelId: "",
    targetType: "everyone", // "everyone", "role", "member"
    message: "",
    date: "",
    time: "",
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

  const handleSave = async () => {
    if (!settings.channelId || !settings.message || !settings.date || !settings.time) {
      setSaveMessage("Please fill all required fields");
      setTimeout(() => setSaveMessage(""), 3000);
      return;
    }

    try {
      const payload = {
        ...settings,
        message: sanitizeDynamic(settings.message),
      };

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/dashboard/servers/${serverId}/scheduler`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (data.success) {
        setSaveMessage("Saved successfully!");
        setSettings({
          channelId: "",
          targetType: "everyone",
          message: "",
          date: "",
          time: "",
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
      <div className="text-center mt-20 text-zinc-500 animate-pulse text-lg">
        Loading channels...
      </div>
    );

  return (
    <div className="min-h-screen px-6 py-16 bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-100
      dark:from-black dark:via-zinc-900 dark:to-black transition-colors duration-700">

      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center mb-10">
        <span className="bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-800
          dark:from-zinc-100 dark:via-zinc-400 dark:to-zinc-100 bg-clip-text text-transparent">
          Scheduler Plugin
        </span>
      </h1>

      <div className="max-w-2xl mx-auto flex flex-col gap-8 p-8 bg-white/60 dark:bg-zinc-900/60
        backdrop-blur-xl rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 transition-all duration-500">

        {/* Channel Selection */}
        <div>
          <label className="block mb-2 font-semibold text-zinc-700 dark:text-zinc-200">
            Select a Channel
          </label>
          <select
            value={settings.channelId}
            onChange={(e) => setSettings({ ...settings, channelId: e.target.value })}
            className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-zinc-500 outline-none transition"
          >
            <option value="">-- Select a channel --</option>
            {channels.map((ch) => (
              <option key={ch.id} value={ch.id}>
                #{ch.name}
              </option>
            ))}
          </select>
        </div>

    
        {/* Message */}
        <div>
          <label className="block mb-2 font-semibold text-zinc-700 dark:text-zinc-200">
            Message
          </label>
          <textarea
            rows={3}
            value={settings.message}
            onChange={(e) => setSettings({ ...settings, message: e.target.value })}
            className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-zinc-500 outline-none resize-none"
            placeholder="Happy Birthday {usermention} in {channel}!"
          />
        </div>

        {/* Date & Time */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block mb-2 font-semibold text-zinc-700 dark:text-zinc-200">
              Date
            </label>
            <input
              type="date"
              value={settings.date}
              onChange={(e) => setSettings({ ...settings, date: e.target.value })}
              className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-zinc-500 outline-none transition"
            />
          </div>
          <div className="flex-1">
            <label className="block mb-2 font-semibold text-zinc-700 dark:text-zinc-200">
              Time
            </label>
            <input
              type="time"
              value={settings.time}
              onChange={(e) => setSettings({ ...settings, time: e.target.value })}
              className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-zinc-500 outline-none transition"
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="px-6 py-2.5 rounded-lg font-semibold bg-gradient-to-r from-zinc-900 to-zinc-700 text-white dark:from-zinc-100 dark:to-zinc-400 dark:text-black hover:opacity-90 shadow-md transition"
        >
          Save Schedule
        </button>

        {/* Save Message */}
        {saveMessage && (
          <div
            className={`mt-2 text-center font-medium ${
              saveMessage.includes("Please") || saveMessage.includes("Error") || saveMessage.includes("Failed")
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

export default Scheduler;
