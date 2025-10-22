import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const ServerInfo = () => {
  const { serverId } = useParams();
  const [settings, setSettings] = useState({
    showMemberCount: true,
    showRegion: true,
    showCreationDate: true,
  });
  const [saveMessage, setSaveMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: fetch saved settings from API
    setLoading(false);
  }, []);

  const handleSave = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/dashboard/servers/${serverId}/plugins/serverInfo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });
      setSaveMessage("Saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch {
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
    <div className="min-h-screen px-4 sm:px-6 md:px-12 py-12 bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-100 dark:from-black dark:via-zinc-900 dark:to-black transition-colors duration-700">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-center mb-10">
        <span className="bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-800 dark:from-zinc-100 dark:via-zinc-400 dark:to-zinc-100 bg-clip-text text-transparent">
          Server Info Plugin
        </span>
      </h1>

      <div className="max-w-3xl mx-auto p-8 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 transition-all duration-500 flex flex-col gap-6">

        <p className="text-zinc-700 dark:text-zinc-200 text-lg sm:text-base">
          Configure which server information should be displayed:
        </p>

        {/* Toggle Options */}
        <div className="flex flex-col gap-4">
          {[
            { label: "Member Count", key: "showMemberCount" },
            { label: "Server Region", key: "showRegion" },
            { label: "Creation Date", key: "showCreationDate" },
          ].map((option) => (
            <label
              key={option.key}
              className="flex items-center justify-between bg-white/20 dark:bg-zinc-800/20 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700"
            >
              <span className="text-zinc-800 dark:text-zinc-200 font-medium">{option.label}</span>
              <input
                type="checkbox"
                checked={settings[option.key]}
                onChange={() =>
                  setSettings((prev) => ({ ...prev, [option.key]: !prev[option.key] }))
                }
                className="w-5 h-5 accent-green-500"
              />
            </label>
          ))}
        </div>

        <button
          onClick={handleSave}
          className="px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-zinc-900 to-zinc-700 text-white dark:from-zinc-100 dark:to-zinc-400 dark:text-black hover:opacity-90 shadow-md transition w-full sm:w-auto self-center"
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

export default ServerInfo;
