import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { sanitizeDynamic } from "../../utils/sanitize";

const Language = () => {
  const { serverId } = useParams();
  const [channels, setChannels] = useState([]);
  const [settings, setSettings] = useState({
    channelId: "",
    time: "",
    language: "",
    enabled: true,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
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
    if (!settings.channelId || !settings.time || !settings.language || !settings.timezone) {
      setSaveMessage("Please select a channel, time, language, and timezone");
      return setTimeout(() => setSaveMessage(""), 3000);
    }

    try {
      const payload = {
        channelId: sanitizeDynamic(settings.channelId),
        time: sanitizeDynamic(settings.time),
        language: sanitizeDynamic(settings.language),
        enabled: settings.enabled,
        timezone: sanitizeDynamic(settings.timezone),
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
        setSaveMessage("Saved successfully!");
        setSettings({
          channelId: "",
          time: "",
          language: "",
          enabled: true,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
        });
      } else {
        setSaveMessage("Failed to save settings");
      }
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setSaveMessage("Error saving settings");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="min-h-screen px-6 py-8 bg-white dark:bg-black">
      <h1 className="text-3xl font-bold mb-6 text-black dark:text-white">Language Plugin</h1>
      <div className="max-w-xl mx-auto flex flex-col gap-6">
        {/* Channel */}
        <div>
          <label className="block mb-2 text-black dark:text-white">Select a channel</label>
          <select
            value={settings.channelId}
            onChange={(e) => setSettings({ ...settings, channelId: e.target.value })}
            className="w-full p-2 border rounded bg-white dark:bg-black dark:text-white"
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
          <label className="block mb-2 text-black dark:text-white">Time (24-hour)</label>
          <input
            type="time"
            value={settings.time}
            onChange={(e) => setSettings({ ...settings, time: e.target.value })}
            step="60"
            className="w-full p-2 border rounded bg-white dark:bg-black dark:text-white"
          />
        </div>

        {/* Language */}
        <div>
          <label className="block mb-2 text-black dark:text-white">Select language</label>
          <select
            value={settings.language}
            onChange={(e) => setSettings({ ...settings, language: e.target.value })}
            className="w-full p-2 border rounded bg-white dark:bg-black dark:text-white"
          >
            <option value="">-- Select a language --</option>
            <option value="japanese">Japanese</option>
            <option value="english">English</option>
            <option value="mandarin">Mandarin</option>
            <option value="hindi">Hindi</option>
            <option value="arabic">Arabic</option>
          </select>
        </div>

        {/* Timezone */}
        <div>
          <label className="block mb-2 text-black dark:text-white">Select timezone</label>
          <select
            value={settings.timezone}
            onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
            className="w-full p-2 border rounded bg-white dark:bg-black dark:text-white"
          >
            <option value="">-- Select timezone --</option>
            {Intl.supportedValuesOf("timeZone").map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="px-6 py-3 rounded-lg bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition"
        >
          Save
        </button>

        {saveMessage && (
          <div
            className={`mt-2 text-center ${
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

export default Language;
