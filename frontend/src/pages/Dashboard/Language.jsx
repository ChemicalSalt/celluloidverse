import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

const Language = () => {
  const { serverId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [channels, setChannels] = useState([]);
  const [settings, setSettings] = useState({
    enabled: false,
    channelId: "",
    time: "10:00",
    language: "japanese",
  });
  const [loading, setLoading] = useState(true);

  // Fetch available channels
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/dashboard/servers/${serverId}/channels`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        setChannels(data);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchSettings = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/dashboard/servers/${serverId}/plugins/language`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setSettings((prev) => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
    fetchSettings();
  }, [serverId, token]);

  const handleSave = async () => {
    try {
      await fetch(
        `${import.meta.env.VITE_API_URL}/dashboard/servers/${serverId}/plugins/language`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(settings),
        }
      );
      alert("Settings saved");
    } catch (err) {
      console.error(err);
      alert("Error saving settings");
    }
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="min-h-screen px-6 py-8 bg-white dark:bg-black">
      <h1 className="text-3xl font-bold mb-6 text-black dark:text-white">
        Language Plugin
      </h1>

      <div className="max-w-xl mx-auto flex flex-col gap-6">
    

        {/* Channel Selector */}
        <div>
          <label className="block mb-2 text-black dark:text-white">
            Select Channel
          </label>
          <select
            value={settings.channelId}
            onChange={(e) =>
              setSettings({ ...settings, channelId: e.target.value })
            }
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

        {/* Time Selector */}
        <div>
          <label className="block mb-2 text-black dark:text-white">
            Time (HH:MM)
          </label>
          <input
            type="time"
            value={settings.time}
            onChange={(e) =>
              setSettings({ ...settings, time: e.target.value })
            }
            className="w-full p-2 border rounded bg-white dark:bg-black dark:text-white"
          />
        </div>

        {/* Language Selector */}
        <div>
          <label className="block mb-2 text-black dark:text-white">
            Language
          </label>
          <select
            value={settings.language}
            onChange={(e) =>
              setSettings({ ...settings, language: e.target.value })
            }
            className="w-full p-2 border rounded bg-white dark:bg-black dark:text-white"
          >
            <option value="japanese">Japanese</option>
          </select>
        </div>

        <button
          onClick={handleSave}
          className="px-6 py-3 rounded-lg bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default Language;
