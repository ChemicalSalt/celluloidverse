import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { sanitizeDynamic } from "../../utils/sanitize";

const Mute = () => {
  const { serverId } = useParams();
  const [settings, setSettings] = useState({ memberId: "", reason: "" });
  const [saveMessage, setSaveMessage] = useState("");

  const handleAction = async (action) => {
    if (!settings.memberId) {
      setSaveMessage("⚠️ Please enter a Member ID");
      setTimeout(() => setSaveMessage(""), 3000);
      return;
    }

    try {
      const payload = { memberId: settings.memberId, reason: sanitizeDynamic(settings.reason) };
      await fetch(
        `${import.meta.env.VITE_API_URL}/dashboard/servers/${serverId}/plugins/mute?action=${action}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );
      setSaveMessage(action === "mute" ? "Member muted!" : "Member unmuted!");
      setTimeout(() => setSaveMessage(""), 3000);
      setSettings({ memberId: "", reason: "" });
    } catch (err) {
      console.error(err);
      setSaveMessage("⚠️ Error performing action");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  return (
    <div
      className="min-h-screen px-4 sm:px-6 md:px-12 py-12 sm:py-16 bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-100
      dark:from-black dark:via-zinc-900 dark:to-black transition-colors duration-700"
    >
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-center mb-8 sm:mb-10">
        <span className="bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-800 dark:from-zinc-100 dark:via-zinc-400 dark:to-zinc-100 bg-clip-text text-transparent">
          Mute / Unmute Plugin
        </span>
      </h1>

      <div className="max-w-full sm:max-w-xl md:max-w-2xl mx-auto flex flex-col gap-6 sm:gap-8 p-6 sm:p-10 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 transition-all duration-500">

        {/* Member ID */}
        <div>
          <label className="block mb-2 font-semibold text-zinc-700 dark:text-zinc-200 text-sm sm:text-base">
            Member ID
          </label>
          <input
            type="text"
            value={settings.memberId}
            onChange={(e) => setSettings({ ...settings, memberId: e.target.value })}
            className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-zinc-500 outline-none transition"
            placeholder="Enter the member's ID"
          />
        </div>

        {/* Reason */}
        <div>
          <label className="block mb-2 font-semibold text-zinc-700 dark:text-zinc-200 text-sm sm:text-base">
            Reason (optional)
          </label>
          <input
            type="text"
            value={settings.reason}
            onChange={(e) => setSettings({ ...settings, reason: e.target.value })}
            className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-zinc-500 outline-none transition"
            placeholder="Reason for mute/unmute"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-4 flex-wrap">
          <button
            onClick={() => handleAction("mute")}
            className="px-8 py-3 rounded-full font-semibold bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg hover:opacity-90 transition w-full sm:w-auto"
          >
            Mute
          </button>
          <button
            onClick={() => handleAction("unmute")}
            className="px-8 py-3 rounded-full font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:opacity-90 transition w-full sm:w-auto"
          >
            Unmute
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

export default Mute;
