// AddBot.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const API_URL = import.meta.env.VITE_API_URL; // e.g. https://yourapi.com/api

const AddBot = () => {
  const [session, setSession] = useState(null);
  const [servers, setServers] = useState([]);
  const navigate = useNavigate();

  // Get session from URL or localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("session");
    if (s) {
      localStorage.setItem("session", s);
      setSession(s);
      // Clean URL (remove session param)
      const url = new URL(window.location.href);
      url.searchParams.delete("session");
      window.history.replaceState({}, "", url.toString());
    } else {
      const stored = localStorage.getItem("session");
      if (stored) setSession(stored);
    }
  }, []);

  // Fetch guilds & server list via backend
  const fetchGuilds = async () => {
    if (!session) return;
    try {
      const res = await fetch(`${API_URL}/dashboard/servers`, {
        headers: { Authorization: `Bearer ${session}` },
      });
      if (!res.ok) {
        // maybe session expired / invalid -> remove and send to login
        if (res.status === 401) {
          localStorage.removeItem("session");
          setSession(null);
          return alert("Session expired, please login again.");
        }
        throw new Error("Failed to fetch guilds");
      }
      const data = await res.json();
      setServers(data);
    } catch (err) {
      console.error("Failed to fetch guilds:", err);
    }
  };

  useEffect(() => {
    fetchGuilds();
  }, [session]);

  // Open Discord invite popup for bot (user will still authorize once per server)
  const handleAddBot = (guildId) => {
    const url = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=bot&guild_id=${guildId}&permissions=8`;
    const popup = window.open(url, "AddBot", "width=600,height=700");

    // poll to refresh list when popup closed (bot may have joined)
    const timer = setInterval(() => {
      if (popup && popup.closed) {
        clearInterval(timer);
        fetchGuilds();
      }
    }, 1000);
  };

  const goToPlugins = (guildId) => {
    navigate(`/dashboard/${guildId}/plugins/overview`); // JWT sent via Authorization header for backend calls
  };

  const gotoLogin = () => {
    // Redirect user to backend login (which will redirect to Discord)
    window.location.href = `${API_URL}/dashboard/login`;
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <h1 className="text-3xl font-bold mb-6">SELECT YOUR SERVER</h1>

      {!session ? (
        <div className="p-6 bg-zinc-200 dark:bg-zinc-800 rounded-xl shadow mb-6">
          <p className="mb-4">You must login with Discord to manage your servers.</p>
          <button onClick={gotoLogin} className="px-4 py-2 bg-blue-600 text-white rounded">Login with Discord</button>
        </div>
      ) : null}

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
