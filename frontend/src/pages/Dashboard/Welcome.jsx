import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { sanitizeDynamic } from "../../utils/sanitize";

const Welcome = () => {
  const { serverId } = useParams();

  const [channels, setChannels] = useState([]);
  const [settings, setSettings] = useState({
    channelId: "",
    serverMessage: "",
    dmMessage: "",
    enabled: true,
    dmEnabled: true,
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
    if (!settings.channelId || (!settings.serverMessage && !settings.dmMessage)) {
      setSaveMessage("Please select a channel and enter at least one message");
      setTimeout(() => setSaveMessage(""), 3000);
      return;
    }

    try {
      const payload = {
        ...settings,
        serverMessage: sanitizeDynamic(settings.serverMessage),
        dmMessage: sanitizeDynamic(settings.dmMessage),
      };

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/dashboard/servers/${serverId}/plugins/welcome`,
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
          serverMessage: "",
          dmMessage: "",
          enabled: true,
          dmEnabled: true,
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
      <div className="text-center mt-20 text-zinc-500 animate-pulse text-lg sm:text-xl">
        Loading channels...
      </div>
    );

  return (
    <div
      className="min-h-screen px-4 sm:px-6 md:px-12 py-12 sm:py-16 bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-100 
    dark:from-black dark:via-zinc-900 dark:to-black transition-colors duration-700"
    >
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-center mb-8 sm:mb-10">
        <span className="bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-800 dark:from-zinc-100 dark:via-zinc-400 dark:to-zinc-100 bg-clip-text text-transparent">
          Welcome Plugin Settings
        </span>
      </h1>

      <div className="max-w-full sm:max-w-xl md:max-w-2xl mx-auto flex flex-col gap-6 sm:gap-8 p-4 sm:p-8 md:p-10 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 transition-all duration-500">
        
        {/* Channel select */}
        <div>
          <label className="block mb-2 font-semibold text-zinc-700 dark:text-zinc-200 text-sm sm:text-base">
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

        {/* Server Message */}
        <div>
          <label className="block mb-2 font-semibold text-zinc-700 dark:text-zinc-200 text-sm sm:text-base">
            Server Message
          </label>
          <textarea
            rows={3}
            value={settings.serverMessage}
            onChange={(e) => setSettings({ ...settings, serverMessage: e.target.value })}
            className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-zinc-500 outline-none resize-none transition"
            placeholder="Welcome {usermention} to {server}!"
          />
        </div>

        {/* DM Message */}
        <div>
          <label className="block mb-2 font-semibold text-zinc-700 dark:text-zinc-200 text-sm sm:text-base">
            DM Message
          </label>
          <textarea
            rows={3}
            value={settings.dmMessage}
            onChange={(e) => setSettings({ ...settings, dmMessage: e.target.value })}
            className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-zinc-500 outline-none resize-none transition"
            placeholder="Hi {usermention}, welcome to our server!"
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center sm:justify-between mt-2">
          <button
            onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
            className={`px-5 py-2.5 rounded-lg font-semibold transition w-full sm:w-auto ${
              settings.enabled
                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg"
                : "bg-zinc-300 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200"
            }`}
          >
            SERVER {settings.enabled ? "ON" : "OFF"}
          </button>

          <button
            onClick={() => setSettings({ ...settings, dmEnabled: !settings.dmEnabled })}
            className={`px-5 py-2.5 rounded-lg font-semibold transition w-full sm:w-auto ${
              settings.dmEnabled
                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg"
                : "bg-zinc-300 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200"
            }`}
          >
            DM {settings.dmEnabled ? "ON" : "OFF"}
          </button>

          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-lg font-semibold bg-gradient-to-r from-zinc-900 to-zinc-700 text-white dark:from-zinc-100 dark:to-zinc-400 dark:text-black hover:opacity-90 shadow-md transition w-full sm:w-auto"
          >
            Save
          </button>
        </div>

        {/* Save message */}
        {saveMessage && (
          <div
            className={`mt-2 text-center font-medium text-sm sm:text-base ${
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

export default Welcome;
