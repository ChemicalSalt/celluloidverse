import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const Farewell = () => {
  const { serverId } = useParams();
  const token = localStorage.getItem("session");

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
      if (!serverId || !token) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/dashboard/servers/${serverId}/channels`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setChannels(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchChannels();
  }, [serverId, token]);

  const handleSave = async () => {
    if (!settings.channelId || (!settings.serverMessage && !settings.dmMessage)) {
      setSaveMessage("Please select a channel and enter at least one message");
      setTimeout(() => setSaveMessage(""), 3000);
      return;
    }

    try {
      const payload = { ...settings };
      const res = await fetch(`${import.meta.env.VITE_API_URL}/dashboard/servers/${serverId}/plugins/farewell`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
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
      <h1 className="text-3xl font-bold mb-6 text-black dark:text-white">Farewell Plugin</h1>

      <div className="max-w-xl mx-auto flex flex-col gap-6">
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

        <div>
          <label className="block mb-2 text-black dark:text-white">Server Message</label>
          <textarea
            rows={3}
            value={settings.serverMessage}
            onChange={(e) => setSettings({ ...settings, serverMessage: e.target.value })}
            className="w-full p-2 border rounded bg-white dark:bg-black dark:text-white resize-none"
          />
        </div>

        <div>
          <label className="block mb-2 text-black dark:text-white">DM Message</label>
          <textarea
            rows={3}
            value={settings.dmMessage}
            onChange={(e) => setSettings({ ...settings, dmMessage: e.target.value })}
            className="w-full p-2 border rounded bg-white dark:bg-black dark:text-white resize-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
            className={`px-3 py-1 rounded ${settings.enabled ? "bg-green-500 text-white" : "bg-gray-300 text-black"}`}
          >
            SERVER {settings.enabled ? "ON" : "OFF"}
          </button>
          <button
            onClick={() => setSettings({ ...settings, dmEnabled: !settings.dmEnabled })}
            className={`px-3 py-1 rounded ${settings.dmEnabled ? "bg-green-500 text-white" : "bg-gray-300 text-black"}`}
          >
            DM {settings.dmEnabled ? "ON" : "OFF"}
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-black text-white dark:bg-white dark:text-black rounded hover:opacity-90"
          >
            Save
          </button>
        </div>
      </div>

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
  );
};

export default Farewell;
