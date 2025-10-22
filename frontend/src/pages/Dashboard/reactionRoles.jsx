import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const ReactionRoles = () => {
  const { serverId } = useParams();
  const [settings, setSettings] = useState({ roleId: "", emoji: "" });
  const [saveMessage, setSaveMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => setLoading(false), []);

  const handleSave = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/dashboard/servers/${serverId}/plugins/reactionRoles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });
      setSaveMessage("Saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setSaveMessage("⚠️ Error saving settings");
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
    <div className="min-h-screen px-4 sm:px-6 md:px-12 py-12 bg-zinc-100 dark:bg-black transition-colors duration-700">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-center mb-10">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-black via-zinc-700 to-black dark:from-white dark:via-zinc-400 dark:to-white">
          Reaction Roles Plugin
        </span>
      </h1>

      <div className="max-w-3xl mx-auto p-8 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 transition-all duration-500 flex flex-col gap-6">
        <p className="text-zinc-700 dark:text-zinc-200 text-lg sm:text-base">
          Assign roles automatically to members when they react with a specified emoji.
        </p>

        <div>
          <label className="block mb-2 font-semibold text-zinc-700 dark:text-zinc-200 text-sm sm:text-base">
            Role ID
          </label>
          <input
            type="text"
            value={settings.roleId}
            onChange={(e) => setSettings({ ...settings, roleId: e.target.value })}
            placeholder="Enter Role ID"
            className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-zinc-500 outline-none transition"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold text-zinc-700 dark:text-zinc-200 text-sm sm:text-base">
            Emoji
          </label>
          <input
            type="text"
            value={settings.emoji}
            onChange={(e) => setSettings({ ...settings, emoji: e.target.value })}
            placeholder="Enter Emoji"
            className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-zinc-500 outline-none transition"
          />
        </div>

        <button
          onClick={handleSave}
          className="px-6 py-3 rounded-lg font-semibold bg-black dark:bg-white text-white dark:text-black hover:opacity-90 shadow-md transition w-full sm:w-auto self-center"
        >
          Save
        </button>

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

export default ReactionRoles;
