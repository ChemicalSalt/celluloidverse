import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const Automod = () => {
  const { serverId } = useParams();
  const [settings, setSettings] = useState({ enabled: true, bannedWords: [] });
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/dashboard/servers/${serverId}/plugins/automod`,
          { credentials: "include" }
        );
        const data = await res.json();
        if (data?.settings) setSettings(data.settings);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [serverId]);

  const handleSave = async () => {
    try {
      const payload = { ...settings };
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/dashboard/servers/${serverId}/plugins/automod`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (data.success) setSaveMessage("Settings saved!");
      else setSaveMessage("❌ Failed to save settings");
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
        Loading Automod settings...
      </div>
    );

  return (
    <div className="min-h-screen px-4 sm:px-6 md:px-12 py-12 sm:py-16 bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-100 dark:from-black dark:via-zinc-900 dark:to-black transition-colors duration-700">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-center mb-8 sm:mb-10">
        <span className="bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-800 dark:from-zinc-100 dark:via-zinc-400 dark:to-zinc-100 bg-clip-text text-transparent">
          Auto-Moderation Plugin
        </span>
      </h1>

      <div className="max-w-full sm:max-w-xl md:max-w-2xl mx-auto flex flex-col gap-6 sm:gap-8 p-6 sm:p-8 md:p-10 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 transition-all duration-500">
        
       

        {/* Banned words input */}
        <div>
          <label className="block mb-2 font-semibold text-zinc-700 dark:text-zinc-200 text-sm sm:text-base">
            Banned Words (comma separated)
          </label>
          <input
            type="text"
            value={settings.bannedWords.join(",")}
            onChange={(e) =>
              setSettings({ ...settings, bannedWords: e.target.value.split(",") })
            }
            className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-zinc-500 outline-none transition"
            placeholder="badword1,badword2,..."
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="px-6 py-2.5 rounded-lg font-semibold bg-gradient-to-r from-zinc-900 to-zinc-700 text-white dark:from-zinc-100 dark:to-zinc-400 dark:text-black hover:opacity-90 shadow-md transition w-full sm:w-auto"
        >
          Save 
        </button>

        {/* Save message */}
        {saveMessage && (
          <div
            className={`mt-2 text-center font-medium text-sm sm:text-base ${
              saveMessage.includes("Failed") || saveMessage.includes("Error")
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

export default Automod;
