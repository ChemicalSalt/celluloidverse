import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

const PluginsOverview = () => {
  const { serverId } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();

  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);

  const category = new URLSearchParams(search).get("category");

  useEffect(() => {
    const fetchServer = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/dashboard/servers/${serverId}`,
          { credentials: "include" }
        );
        setServer(await res.json());
      } catch {
        console.error("Failed to fetch server");
      } finally {
        setLoading(false);
      }
    };
    fetchServer();
  }, [serverId]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black text-gray-600 dark:text-gray-300">
        Loading plugins...
      </div>
    );

  if (!server)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black text-gray-600 dark:text-gray-300">
        No server data
      </div>
    );

  // ------------------------- ALL PLUGINS -------------------------
  const allPlugins = {
    moderation: [
      { name: "Auto-Moderation", path: "automod", enabled: server.plugins?.automod?.enabled ?? false },
      { name: "Mute/Unmute", path: "mute", enabled: server.plugins?.mute?.enabled ?? false },
    ],
    automation: [
      { name: "Language", path: "language", enabled: server.plugins?.language?.globalEnabled ?? false },
      { name: "Scheduler", path: "scheduler", enabled: server.plugins?.scheduler?.enabled ?? false },
      { name: "Welcome", path: "welcome", enabled: server.plugins?.welcome?.enabled ?? false },
      { name: "Farewell", path: "farewell", enabled: server.plugins?.farewell?.enabled ?? false },
    ],
    utility: [
      { name: "Polls", path: "polls", enabled: server.plugins?.polls?.enabled ?? false },
      { name: "Server Info", path: "serverInfo", enabled: server.plugins?.serverInfo?.enabled ?? false },
      { name: "Invite Tracker", path: "inviteTracker", enabled: server.plugins?.inviteTracker?.enabled ?? false },
      { name: "Reaction Roles", path: "reactionRoles", enabled: server.plugins?.reactionRoles?.enabled ?? false },
    ],
    entertainment: [
      { name: "Games", path: "games", enabled: server.plugins?.games?.enabled ?? false },
      { name: "Memes", path: "memes", enabled: server.plugins?.memes?.enabled ?? false },
      { name: "Music", path: "music", enabled: server.plugins?.music?.enabled ?? false },
    ],
  };

  const plugins = allPlugins[category] || [];

  const handleToggle = async (plugin) => {
    try {
      const newEnabled = !plugin.enabled;
      setServer((prev) => ({
        ...prev,
        plugins: {
          ...prev.plugins,
          [plugin.path]:
            plugin.path === "language"
              ? { ...prev.plugins[plugin.path], globalEnabled: newEnabled }
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
    } catch {
      console.error("Failed to toggle plugin");
    }
  };

  return (
    <div className="min-h-screen px-6 py-12 bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      <h1 className="text-3xl md:text-4xl font-extrabold mb-12 capitalize text-center">
        {category} Plugins
      </h1>

      {plugins.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">
          No plugins added for this category yet.
        </p>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {plugins.map((plugin) => (
            <div
              key={plugin.name}
              className="p-6 bg-white/10 dark:bg-black/30 backdrop-blur-md border border-black/10 dark:border-white/20 rounded-3xl shadow-lg hover:shadow-2xl hover:scale-[1.03] transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">{plugin.name}</h2>
                {/* Fancy Toggle */}
               <label className="relative inline-flex items-center cursor-pointer select-none">
  <input
    type="checkbox"
    className="sr-only peer"
    checked={plugin.enabled}
    onChange={() => handleToggle(plugin)}
  />
  {/* Background */}
  <div className="w-16 h-8 bg-gray-300 dark:bg-gray-700 rounded-full peer-checked:bg-green-500 transition-colors duration-300"></div>
  {/* Circle */}
  <div className="absolute top-0.5 left-0.5 w-7 h-7 bg-white rounded-full shadow-md transition-transform duration-300 peer-checked:translate-x-8 flex items-center justify-center">
    <div className="w-5 h-5 bg-white rounded-full"></div>
  </div>
</label>

              </div>

              {plugin.enabled ? (
                <button
                  onClick={() => navigate(`/dashboard/${serverId}/plugins/${plugin.path}`)}
                  className="w-full py-3 rounded-full bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition font-semibold"
                >
                  Configure
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-3 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                >
                  Disabled
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PluginsOverview;
