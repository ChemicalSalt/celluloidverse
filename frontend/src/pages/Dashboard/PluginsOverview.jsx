import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";

const PluginsOverview = () => {
  const { serverId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [server, setServer] = useState(null);

  useEffect(() => {
    if (!token || !serverId) return;

    const fetchServer = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/dashboard/servers/${serverId}`,
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
      enabled: server.plugins?.welcome?.enabled,
    },
    {
      name: "Farewell",
      path: "farewell",
      enabled: server.plugins?.farewell?.enabled,
    },
    {
      name: "Language",
      path: "language",
      enabled: server.plugins?.language?.enabled,
    },
  ];

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

            <button
              className="mt-4 px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition"
              onClick={() =>
                navigate(
                  `/dashboard/${serverId}/plugins/${plugin.path}?token=${token}`
                )
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
