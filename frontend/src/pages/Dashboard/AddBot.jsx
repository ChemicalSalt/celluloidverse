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
      } else startDiscordAuth();
    } catch {
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
      setServers(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startDiscordAuth = () => {
    window.location.href = `${API_URL}/dashboard/auth/login`;
  };

  useEffect(() => { checkSession(); }, []);
  useEffect(() => { if (authChecked) fetchGuilds(); }, [authChecked]);

  const handleAddBot = (guildId) => {
    const url = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=bot+applications.commands&permissions=8&guild_id=${guildId}`;
    const popup = window.open(url, "AddBot", "width=600,height=700");
    const timer = setInterval(() => { if (popup?.closed) { clearInterval(timer); fetchGuilds(); } }, 1000);
  };
  const goToPlugins = (guildId) => navigate(`/dashboard/${guildId}/plugins/category`);

  if (loading)
    return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black text-black dark:text-white">
      <div className="animate-pulse text-lg">Loading servers...</div>
    </div>;

  return (
    <div className="min-h-screen px-6 py-12 bg-white dark:bg-black text-black dark:text-white">
      <h1 className="text-4xl font-bold mb-12 text-center tracking-tight">Select Your Server</h1>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {servers.map((g) => (
          <div key={g.id} className="p-6 bg-white/30 dark:bg-black/30 backdrop-blur-md border border-black/10 dark:border-white/20 rounded-2xl shadow-lg hover:scale-105 transition-transform flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full overflow-hidden mb-4">
              {g.icon ? (
                <img src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`} alt={g.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-300 dark:bg-gray-700 rounded-full" />
              )}
            </div>
            <h2 className="text-lg font-semibold mb-4">{g.name}</h2>
            {!g.hasBot ? (
              <button onClick={() => handleAddBot(g.id)} className="px-6 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black hover:opacity-80 transition font-semibold">
                Add Bot
              </button>
            ) : (
              <button onClick={() => goToPlugins(g.id)} className="px-6 py-2 rounded-full border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition font-semibold">
                Plug-ins
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AddBot;
