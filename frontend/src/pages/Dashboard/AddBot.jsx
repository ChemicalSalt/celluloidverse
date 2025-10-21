import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;

const AddBot = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();

  const checkSession = async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard/auth/session`, {
        credentials: "include",
      });

      if (res.status === 200 || res.status === 304) {
        await res.json().catch(() => ({}));
        setAuthChecked(true);
        return;
      }

      if (res.status === 401) startDiscordAuth();
    } catch (err) {
      console.error("❌ Session check failed:", err);
      startDiscordAuth();
    } finally {
      setLoading(false);
    }
  };

  const fetchGuilds = async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard/servers`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch guilds");

      const data = await res.json();
      setServers(data);
    } catch (err) {
      console.error("❌ Failed to fetch guilds:", err);
    } finally {
      setLoading(false);
    }
  };

  const startDiscordAuth = () => {
    window.location.href = `${API_URL}/dashboard/auth/login`;
  };

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (authChecked) fetchGuilds();
  }, [authChecked]);

  const handleAddBot = (guildId) => {
    const url = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=bot+applications.commands&permissions=8&integration_type=0&guild_id=${guildId}`;
    const popup = window.open(url, "AddBot", "width=600,height=700");

    const timer = setInterval(() => {
      if (popup && popup.closed) {
        clearInterval(timer);
        fetchGuilds();
      }
    }, 1000);
  };

  const goToPlugins = (guildId) => {
    navigate(`/dashboard/${guildId}/plugins/overview`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-100 dark:from-black dark:via-zinc-900 dark:to-black">
        <p className="text-lg font-semibold text-zinc-700 dark:text-zinc-200 animate-pulse">
          Loading your servers...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-16 bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-100 dark:from-black dark:via-zinc-900/80 dark:to-black text-zinc-900 dark:text-zinc-100 transition-colors duration-700">
      <div className="max-w-4xl mx-auto text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-zinc-400 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Select Your Server
          </span>
        </h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          Choose a server to add Celluloidverse or manage its plugins.
        </p>
      </div>

      {servers.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {servers.map((g) => (
            <div
              key={g.id}
              className="group p-5 rounded-2xl bg-zinc-200/70 dark:bg-zinc-900/70 shadow-md border border-zinc-300/40 dark:border-zinc-700/40 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="flex items-center gap-3 mb-4">
                {g.icon ? (
                  <img
                    src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`}
                    alt={g.name}
                    className="w-12 h-12 rounded-full border border-zinc-300 dark:border-zinc-700 shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center text-lg font-bold">
                    {g.name.charAt(0)}
                  </div>
                )}
                <span className="font-semibold text-lg">{g.name}</span>
              </div>

              {!g.hasBot ? (
                <button
                  onClick={() => handleAddBot(g.id)}
                  className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-zinc-800 to-zinc-900 text-white hover:from-zinc-700 hover:to-zinc-800 transition-all duration-300 shadow-inner"
                >
                  Add Bot
                </button>
              ) : (
                <button
                  onClick={() => goToPlugins(g.id)}
                  className="w-full px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300 transition-all duration-300"
                >
                  Plug-ins
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-zinc-600 dark:text-zinc-400">
          You don’t have permission to manage any servers.
        </div>
      )}
    </div>
  );
};

export default AddBot;
