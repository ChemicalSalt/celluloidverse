import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const PluginsOverview = () => {
  const { serverId } = useParams();
  const navigate = useNavigate();

  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serverId) return;

    const fetchServer = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/dashboard/servers/${serverId}`, {
          credentials: "include",
        });
        const data = await res.json();
        setServer(data);
      } catch (err) {
        console.error("Failed to fetch server:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchServer();
  }, [serverId]);

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (!server) return <div className="text-center mt-10">No server data</div>;

  const plugins = [
    {
      name: "Welcome",
      path: "welcome",
      enabled: server.plugins?.welcome?.enabled || false,
    },
    {
      name: "Farewell",
      path: "farewell",
      enabled: server.plugins?.farewell?.enabled || false,
    },
    {
      name: "Language",
      path: "language",
      enabled: server.plugins?.language?.enabled || false,
    },
  ];

  const handleToggle = async (plugin) => {
    try {
      const newEnabled = !plugin.enabled;

      setServer((prev) => ({
        ...prev,
        plugins: {
          ...prev.plugins,
          [plugin.path]: {
            ...prev.plugins[plugin.path],
            enabled: newEnabled,
          },
        },
      }));

      await fetch(
        `${import.meta.env.VITE_API_URL}/dashboard/servers/${serverId}/plugins/${plugin.path}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ enabled: newEnabled }),
        }
      );
    } catch (err) {
      console.error("Failed to toggle plugin:", err);
    }
  };

  return (
    <div className="min-h-screen px-6 py-8 bg-white dark:bg-black">
      <h1 className="text-3xl font-bold mb-8 text-black dark:text-white">
        Plugins Overview
      </h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plugins.map((plugin) => (
          <div
            key={plugin.name}
            className="p-6 rounded-2xl shadow-md border border-black dark:border-white flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-black dark:text-white mb-1">
                  {plugin.name}
                </h2>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={plugin.enabled}
                  onChange={() => handleToggle(plugin)}
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-500 transition"></div>
                <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition peer-checked:translate-x-5"></div>
              </label>
            </div>

            <button
              className="mt-6 px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition"
              onClick={() =>
                navigate(`/dashboard/${serverId}/plugins/${plugin.path}`)
              }
            >
              Configure {plugin.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PluginsOverview;
