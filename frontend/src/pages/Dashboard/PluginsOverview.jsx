import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";

const PluginsOverview = () => {
  const { serverId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [server, setServer] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!token || !serverId) return;

    const fetchServer = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/servers/${serverId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        setServer(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchServer();
  }, [token, serverId]);

  if (!server) return <div className="text-center mt-10">Loading...</div>;

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
    const newStatus = !plugin.enabled;

    setUpdating(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/servers/${serverId}/plugins/${plugin.path}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...server.plugins?.[plugin.path],
            enabled: newStatus,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to update plugin");

      const data = await res.json();
      console.log("Plugin updated:", data);

      // Update local state
      setServer((prev) => ({
        ...prev,
        plugins: {
          ...prev.plugins,
          [plugin.path]: {
            ...prev.plugins?.[plugin.path],
            enabled: newStatus,
          },
        },
      }));
    } catch (err) {
      console.error("Error updating plugin:", err);
      alert("Failed to update plugin. Check logs.");
    } finally {
      setUpdating(false);
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
            <div>
              <h2 className="text-xl font-semibold text-black dark:text-white mb-2">
                {plugin.name}
              </h2>
              <p
                className={`text-sm font-medium ${
                  plugin.enabled
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {plugin.enabled ? "Enabled" : "Disabled"}
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button
                className={`px-4 py-2 rounded-xl ${
                  plugin.enabled
                    ? "bg-red-600 text-white dark:bg-red-400 dark:text-black"
                    : "bg-green-600 text-white dark:bg-green-400 dark:text-black"
                } hover:opacity-90 transition`}
                disabled={updating}
                onClick={() => handleToggle(plugin)}
              >
                {plugin.enabled ? "Disable" : "Enable"} {plugin.name}
              </button>

              <button
                className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition"
                onClick={() =>
                  navigate(
                    `/dashboard/${serverId}/plugins/${plugin.path}?token=${token}`
                  )
                }
              >
                Configure {plugin.name}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PluginsOverview;
