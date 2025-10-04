import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const AddBot = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ Fetch guilds dynamically from backend
  const fetchGuilds = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/dashboard/servers`, {
        method: "GET",
        credentials: "include", // sends HttpOnly cookie
      });

      if (res.status === 401) {
        // not logged in → auto start Discord auth
        startDiscordAuth();
        return;
      }

      const data = await res.json();
      setServers(data);
    } catch (err) {
      console.error("Failed to fetch guilds:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Backend builds proper Discord OAuth URL dynamically
  const startDiscordAuth = async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard/auth/url`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Go straight to Discord OAuth
      }
    } catch (err) {
      console.error("Error starting Discord auth:", err);
    }
  };

  useEffect(() => {
    fetchGuilds();
  }, []);

  const handleAddBot = (guildId) => {
    const clientId = import.meta.env.VITE_CLIENT_ID;
    const url = `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=bot&guild_id=${guildId}&permissions=8`;

    const popup = window.open(url, "AddBot", "width=600,height=700");

    const timer = setInterval(() => {
      if (popup && popup.closed) {
        clearInterval(timer);
        fetchGuilds(); // refresh after closing popup
      }
    }, 1000);
  };

  const goToPlugins = (guildId) => {
    navigate(`/dashboard/${guildId}/plugins/overview`);
  };

  // ✅ Show loading while fetching
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-semibold">Loading your servers...</p>
      </div>
    );
  }

  // ✅ Render user servers
  return (
    <div className="min-h-screen px-6 py-8">
      <h1 className="text-3xl font-bold mb-6">SELECT YOUR SERVER</h1>

      {servers.length > 0 && (
        <div className="p-6 bg-zinc-200 dark:bg-zinc-800 rounded-xl shadow flex flex-col gap-4 mb-6">
          <h2 className="font-bold text-xl">Your Servers</h2>
          {servers.map((g) => (
            <div key={g.id} className="flex items-center justify-between p-2 border-b">
              <div className="flex items-center gap-2">
                {g.icon && (
                  <img
                    src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`}
                    alt={g.name}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span>{g.name}</span>
              </div>
              {!g.hasBot ? (
                <button
                  onClick={() => handleAddBot(g.id)}
                  className="px-4 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Add Bot
                </button>
              ) : (
                <button
                  onClick={() => goToPlugins(g.id)}
                  className="px-4 py-1 bg-black text-white rounded hover:bg-gray-300 dark:bg-white dark:text-black dark:hover:bg-gray-300"
                >
                  Plug-ins
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddBot;
