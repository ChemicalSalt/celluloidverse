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
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/dashboard/servers/${serverId}`,
          { credentials: "include" }
        );
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

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-100 dark:from-black dark:via-zinc-900/80 dark:to-black">
        <p className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 animate-pulse">
          Loading plugins...
        </p>
      </div>
    );

  if (!server)
    return (
      <div className="text-center mt-10 text-zinc-600 dark:text-zinc-400">
        No server data available.
      </div>
    );

  const plugins = [
    {
      name: "Welcome",
      path: "welcome",
      enabled: server.plugins?.welcome?.enabled ?? false,
    },
    {
      name: "Farewell",
      path: "farewell",
      enabled: server.plugins?.farewell?.enabled ?? false,
    },
    {
      name: "Language",
      path: "language",
      enabled: server.plugins?.language?.globalEnabled ?? false,
    },
  ];

  const handleToggle = async (plugin) => {
    try {
      const newEnabled = !plugin.enabled;

      setServer((prev) => ({
        ...prev,
        plugins: {
          ...prev.plugins,
          [plugin.path]:
            plugin.path === "language"
              ? {
                  ...prev.plugins[plugin.path],
                  globalEnabled: newEnabled,
                }
              : { ...prev.plugins[plugin.path], enabled: newEnabled },
        },
      }));

      await fetch(
        `${import.meta.env.VITE_API_URL}/dashboard/servers/${serverId}/plugins/${plugin.path}/toggle`,
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
    <div className="min-h-screen px-6 py-16 text-zinc-900 dark:text-zinc-100 bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-100 dark:from-black dark:via-zinc-900/80 dark:to-black transition-colors duration-700">
      <div className="max-w-5xl mx-auto text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-zinc-400 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Plugins Overview
          </span>
        </h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          Manage and configure your bot’s features in one elegant dashboard.
        </p>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
        {plugins.map((plugin) => (
          <div
            key={plugin.name}
            className="p-6 rounded-2xl shadow-lg border border-zinc-300/40 dark:border-zinc-700/40 bg-zinc-100/70 dark:bg-zinc-900/70 backdrop-blur-sm hover:scale-[1.02] hover:shadow-xl transition-all duration-300"
          >
            {/* Plugin Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">{plugin.name}</h2>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={plugin.enabled}
                  onChange={() => handleToggle(plugin)}
                />
                <div className="w-12 h-7 rounded-full bg-zinc-300 peer-checked:bg-green-500 transition-all duration-300"></div>
                <div className="absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-all duration-300 peer-checked:translate-x-5"></div>
              </label>
            </div>

            {/* Button */}
            {plugin.enabled ? (
              <button
                className="w-full px-4 py-2 rounded-xl bg-white text-black dark:bg-zinc-100 dark:text-black hover:bg-zinc-200 transition-all duration-300"
                onClick={() =>
                  navigate(`/dashboard/${serverId}/plugins/${plugin.path}`)
                }
              >
                Configure {plugin.name}
              </button>
            ) : (
              <button
                disabled
                className="w-full px-4 py-2 rounded-xl bg-zinc-400 text-white opacity-60 cursor-not-allowed transition"
              >
                Enable to Configure
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PluginsOverview;
