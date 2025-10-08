import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
console.log("API_URL in React:", API_URL);
console.log("CLIENT_ID in React:", CLIENT_ID);
const AddBot = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();

  // 1️⃣ Check if user has valid session
  const checkSession = async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard/auth/session`, {
        credentials: "include",
      });

      if (res.ok) {
        setAuthChecked(true);
      } else {
        // No session — redirect directly to Discord OAuth
        startDiscordAuth();
      }
    } catch (err) {
      console.error("Session check failed:", err);
    }
  };

  // 2️⃣ Fetch servers/guilds
  const fetchGuilds = async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard/servers`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch guilds");
      const data = await res.json();
      setServers(data);
    } catch (err) {
      console.error("Failed to fetch guilds:", err);
    } finally {
      setLoading(false);
    }
  };

  // 3️⃣ Start Discord OAuth by redirect
  const startDiscordAuth = () => {
    window.location.href = `${API_URL}/dashboard/auth/login`;
  };

  // 4️⃣ Run auth check on mount
  useEffect(() => {
    checkSession();
  }, []);

  // 5️⃣ Fetch guilds once user is verified
  useEffect(() => {
    if (authChecked) fetchGuilds();
  }, [authChecked]);

  // 6️⃣ Add bot to server
  const handleAddBot = (guildId) => {
    const url = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=bot&guild_id=${guildId}&permissions=8`;
    const popup = window.open(url, "AddBot", "width=600,height=700");

    const timer = setInterval(() => {
      if (popup && popup.closed) {
        clearInterval(timer);
        fetchGuilds();
      }
    }, 1000);
  };

  // 7️⃣ Go to plugin dashboard
  const goToPlugins = (guildId) => {
    navigate(`/dashboard/${guildId}/plugins/overview`);
  };

  // 8️⃣ Loading state
  if (loading || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-semibold">Loading your servers...</p>
      </div>
    );
  }

  // 9️⃣ Display servers
  return (
    <div className="min-h-screen px-6 py-8">
      <h1 className="text-3xl font-bold mb-6">SELECT YOUR SERVER</h1>

      {servers.length > 0 ? (
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
      ) : (
        <p>You don't own any servers where you can add the bot.</p>
      )}
    </div>
  );
};

export default AddBot;
