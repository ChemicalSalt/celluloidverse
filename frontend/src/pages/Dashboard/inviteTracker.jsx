import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const Games = () => {
  const { serverId } = useParams();
  const [settings, setSettings] = useState({ enabled: true, gameName: "Letter Chase" });
  const [saveMessage, setSaveMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch saved settings from server if needed
    setLoading(false);
  }, []);

  const handleSave = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/dashboard/servers/${serverId}/plugins/games`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });
      setSaveMessage("Plugin saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch {
      setSaveMessage("⚠️ Error saving plugin");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  if (loading)
    return (
      <p className="text-center mt-20 text-zinc-500 animate-pulse text-lg sm:text-xl">
        Loading...
      </p>
    );

  return (
    <div className="min-h-screen px-6 py-12 bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-100 dark:from-black dark:via-zinc-900 dark:to-black transition-colors duration-700">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-center mb-10">
        <span className="bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-800 dark:from-zinc-100 dark:via-zinc-400 dark:to-zinc-100 bg-clip-text text-transparent">
          Games Plugin
        </span>
      </h1>

      <div className="max-w-3xl mx-auto p-8 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 transition-all duration-500 flex flex-col gap-6">
        <p className="text-zinc-700 dark:text-zinc-200 text-lg sm:text-base">
          Configure your games plugin. This plugin allows you to run server games like <strong>Letter Chase</strong>.
        </p>

        {/* Game Name */}
        <div>
          <label className="block mb-2 font-semibold text-zinc-700 dark:text-zinc-200 text-sm sm:text-base">
            Game Name
          </label>
          <input
            type="text"
            value={settings.gameName}
            onChange={(e) => setSettings({ ...settings, gameName: e.target.value })}
            className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-zinc-500 outline-none transition"
          />
        </div>

        {/* Enabled Toggle */}
        <div className="flex items-center gap-3">
          <label className="block font-semibold text-zinc-700 dark:text-zinc-200 text-sm sm:text-base">
            Enable Plugin
          </label>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={() => setSettings({ ...settings, enabled: !settings.enabled })}
            className="w-6 h-6 accent-black dark:accent-white"
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="px-6 py-3 rounded-lg font-semibold bg-black text-white dark:bg-white dark:text-black hover:opacity-90 shadow-md transition w-full sm:w-auto self-center"
        >
          Save Plugin
        </button>

        {/* Save Message */}
        {saveMessage && (
          <p
            className={`mt-2 text-center font-medium text-sm sm:text-base ${
              saveMessage.includes("Error") ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
            }`}
          >
            {saveMessage}
          </p>
        )}
      </div>
    </div>
  );
};

export default Games;
