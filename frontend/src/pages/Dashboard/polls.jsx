import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { sanitizeDynamic } from "../../utils/sanitize";

const Polls = () => {
  const { serverId } = useParams();
  const [settings, setSettings] = useState({ question: "", options: "" });
  const [saveMessage, setSaveMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => setLoading(false), []);

  const handleSave = async () => {
    if (!settings.question || !settings.options) {
      setSaveMessage("⚠️ Please enter a question and at least one option");
      setTimeout(() => setSaveMessage(""), 3000);
      return;
    }

    try {
      const payload = {
        question: sanitizeDynamic(settings.question),
        options: settings.options.split(",").map((opt) => sanitizeDynamic(opt.trim())),
      };

      await fetch(`${import.meta.env.VITE_API_URL}/dashboard/servers/${serverId}/plugins/polls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      setSaveMessage("Poll saved!");
      setSettings({ question: "", options: "" });
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setSaveMessage("⚠️ Error saving poll");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  if (loading)
    return (
      <p className="text-center mt-20 text-zinc-500 animate-pulse text-lg sm:text-xl">
        Loading poll settings...
      </p>
    );

  return (
    <div
      className="min-h-screen px-4 sm:px-6 md:px-12 py-12 sm:py-16 bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-100 
      dark:from-black dark:via-zinc-900 dark:to-black transition-colors duration-700"
    >
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-center mb-8 sm:mb-10">
        <span className="bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-800 dark:from-zinc-100 dark:via-zinc-400 dark:to-zinc-100 bg-clip-text text-transparent">
          Polls Plugin
        </span>
      </h1>

      <div className="max-w-full sm:max-w-xl md:max-w-2xl mx-auto flex flex-col gap-6 sm:gap-8 p-6 sm:p-10 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 transition-all duration-500">
        
        {/* Question */}
        <div>
          <label className="block mb-2 font-semibold text-zinc-700 dark:text-zinc-200 text-sm sm:text-base">
            Poll Question
          </label>
          <input
            type="text"
            value={settings.question}
            onChange={(e) => setSettings({ ...settings, question: e.target.value })}
            className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-zinc-500 outline-none transition"
            placeholder="Enter your poll question"
          />
        </div>

        {/* Options */}
        <div>
          <label className="block mb-2 font-semibold text-zinc-700 dark:text-zinc-200 text-sm sm:text-base">
            Options (comma separated)
          </label>
          <input
            type="text"
            value={settings.options}
            onChange={(e) => setSettings({ ...settings, options: e.target.value })}
            className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-zinc-500 outline-none transition"
            placeholder="Option 1, Option 2, Option 3"
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-center mt-4">
          <button
            onClick={handleSave}
            className="px-8 py-3 rounded-full font-semibold bg-gradient-to-r from-zinc-900 to-zinc-700 text-white dark:from-zinc-100 dark:to-zinc-400 dark:text-black hover:opacity-90 shadow-lg transition w-full sm:w-auto"
          >
            Save Poll
          </button>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div
            className={`mt-4 text-center font-medium text-sm sm:text-base ${
              saveMessage.includes("Error") || saveMessage.includes("⚠️")
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

export default Polls;
