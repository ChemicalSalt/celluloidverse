// AddBot.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const API_URL = import.meta.env.VITE_API_URL;

const AddBot = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true); // ✅ added
  const navigate = useNavigate();

  // Fetch user servers from backend
  const fetchGuilds = async () => {
    try {
      setLoading(true); // ✅ start loading
      const res = await fetch(`${API_URL}/dashboard/servers`, {
        method: "GET",
        credentials: "include", // ✅ sends HttpOnly cookie automatically
      });

      if (!res.ok) {
        if (res.status === 401) {
          setServers([]); // no valid session
        } else {
          throw new Error("Failed to fetch guilds");
        }
      } else {
        const data = await res.json();
        setServers(data);
      }
    } catch (err) {
      console.error("Failed to fetch guilds:", err);
    } finally {
      setLoading(false); // ✅ stop loading
    }
  };

  useEffect(() => {
    fetchGuilds();
  }, []);

  const handleAddBot = (guildId) => {
    const url = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=bot&guild_id=${guildId}&permissions=8`;
    const popup = window.open(url, "AddBot", "width=600,height=700");

    const timer = setInterval(() => {
      if (popup && popup.closed) {
        clearInterval(timer);
        fetchGuilds(); // refresh servers after closing popup
      }
    }, 1000);
  };

  const goToPlugins = (guildId) => {
    navigate(`/dashboard/${guildId}/plugins/overview`);
  };

  const gotoLogin = () => {
    // redirect to backend login, cookie will be set automatically
    window.location.href = `${API_URL}/dashboard/login`;
  };

  // ✅ NEW — while loading, show loader
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-semibold">Loading your servers...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <h1 className="text-3xl font-bold mb-6">SELECT YOUR SERVER</h1>

      {servers.length === 0 ? (
        <div className="p-6 bg-zinc-200 dark:bg-zinc-800 rounded-xl shadow mb-6">
          <p className="mb-4">You must login with Discord to manage your servers.</p>
          <button onClick={gotoLogin} className="px-4 py-2 bg-blue-600 text-white rounded">
            Login with Discord
          </button>
        </div>
      ) : (
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
