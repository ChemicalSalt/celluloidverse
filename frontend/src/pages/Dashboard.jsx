import { useState, useEffect } from "react";

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;

const Dashboard = () => {
  const [token, setToken] = useState(null);
  const [servers, setServers] = useState([]);      // all servers user can manage
  const [selectedServer, setSelectedServer] = useState(null); // for features page
  const [messages, setMessages] = useState({
    serverWelcome: "",
    dmWelcome: "",
    serverFarewell: "",
    dmFarewell: "",
  });
  const [saveMessage, setSaveMessage] = useState("");

  // New: toggles for individual features
  const [serverWelcomeEnabled, setServerWelcomeEnabled] = useState(true);
  const [dmWelcomeEnabled, setDmWelcomeEnabled] = useState(true);
  const [serverFarewellEnabled, setServerFarewellEnabled] = useState(true);
  const [dmFarewellEnabled, setDmFarewellEnabled] = useState(true);

  // --- NEW: channel selection states ---
  const [channels, setChannels] = useState([]);
  const [selectedWelcomeChannel, setSelectedWelcomeChannel] = useState("");
  const [selectedFarewellChannel, setSelectedFarewellChannel] = useState("");

  // Get OAuth token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    setToken(t);
  }, []);

  // Fetch user's guilds from backend
  const fetchGuilds = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/dashboard/servers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setServers(data); // all servers
    } catch (err) {
      console.error("Failed to fetch guilds:", err);
    }
  };

  useEffect(() => {
    fetchGuilds();
  }, [token]);

  // Handle Add Bot
  const handleAddBot = guildId => {
    const url = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=bot&guild_id=${guildId}&permissions=8`;
    const popup = window.open(url, "AddBot", "width=600,height=700");

    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        fetchGuilds(); // refresh guilds
      }
    }, 1000);
  };

  // Handle Dashboard click
  const handleDashboard = guildId => {
    const server = servers.find(s => s.id === guildId);
    if (server) setSelectedServer(server);
  };

  const handleChange = (field, value) => {
    setMessages(prev => ({ ...prev, [field]: value }));
  };

  // --- Fetch messages when server selected ---
  useEffect(() => {
    if (!selectedServer || !token) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/dashboard/servers/${selectedServer.id}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        // keep blank initially
        setMessages({
          serverWelcome: "",
          dmWelcome: "",
          serverFarewell: "",
          dmFarewell: "",
        });
        setSelectedWelcomeChannel("");
        setSelectedFarewellChannel("");

      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };

    fetchMessages();
  }, [selectedServer, token]);

  // --- Fetch channels when server selected ---
  useEffect(() => {
    if (!selectedServer || !token) return;

    const fetchChannels = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/dashboard/servers/${selectedServer.id}/channels`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = await res.json();
        setChannels(data);
        setSelectedWelcomeChannel("");
        setSelectedFarewellChannel("");
      } catch (err) {
        console.error("Failed to fetch channels:", err);
      }
    };

    fetchChannels();
  }, [selectedServer, token]);

  // --- Handle Save per feature ---
  const handleSave = async (feature) => {
    try {
      let payload = {};

      if (feature === "welcomeServer") {
        payload = {
          welcome: {
            enabled: serverWelcomeEnabled,
            channelId: selectedWelcomeChannel,
            serverMessage: messages.serverWelcome,
          },
        };
      } else if (feature === "welcomeDM") {
        payload = {
          welcome: {
            dmEnabled: dmWelcomeEnabled,
            dmMessage: messages.dmWelcome,
          },
        };
      } else if (feature === "farewellServer") {
        payload = {
          farewell: {
            enabled: serverFarewellEnabled,
            channelId: selectedFarewellChannel,
            serverMessage: messages.serverFarewell,
          },
        };
      } else if (feature === "farewellDM") {
        payload = {
          farewell: {
            dmEnabled: dmFarewellEnabled,
            dmMessage: messages.dmFarewell,
          },
        };
      }

      await fetch(`${import.meta.env.VITE_API_URL}/dashboard/servers/${selectedServer.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setSaveMessage("Saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      console.error("Failed to save messages:", err);
      setSaveMessage("Failed to save messages. Try again.");
    }
  };

  // Show features page if server selected
  if (selectedServer) {
    return (
      <div className="min-h-screen px-6 py-8">
        <h1 className="text-3xl font-bold mb-6">Bot Features - {selectedServer.name}</h1>
        <div className="p-6 bg-zinc-200 dark:bg-zinc-800 rounded-xl shadow flex flex-col gap-4">
          <h2 className="font-bold text-xl">Configure Messages</h2>

          {/* Welcome Messages */}
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-lg">Welcome Messages</h3>
            <div className="flex flex-col">
              <label>Server Welcome</label>
              <input
                type="text"
                placeholder="Welcome {usermention}!"
                value={messages.serverWelcome}
                onChange={e => handleChange("serverWelcome", e.target.value)}
                className="p-2 rounded border"
              />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => setServerWelcomeEnabled(true)}
                className={`px-3 py-1 rounded ${serverWelcomeEnabled ? 'bg-green-500 text-white' : 'bg-gray-300 text-black'}`}
              >
                On
              </button>
              <button
                onClick={() => setServerWelcomeEnabled(false)}
                className={`px-3 py-1 rounded ${!serverWelcomeEnabled ? 'bg-red-500 text-white' : 'bg-gray-300 text-black'}`}
              >
                Off
              </button>
              <button
                onClick={() => handleSave("welcomeServer")}
                className="px-4 py-1 bg-purple-600 text-white rounded ml-2"
              >
                Save
              </button>
            </div>

            <div className="flex flex-col mt-2">
              <label>DM Welcome</label>
              <input
                type="text"
                placeholder="Hi {username}!"
                value={messages.dmWelcome}
                onChange={e => handleChange("dmWelcome", e.target.value)}
                className="p-2 rounded border"
              />
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => setDmWelcomeEnabled(true)}
                  className={`px-3 py-1 rounded ${dmWelcomeEnabled ? 'bg-green-500 text-white' : 'bg-gray-300 text-black'}`}
                >
                  On
                </button>
                <button
                  onClick={() => setDmWelcomeEnabled(false)}
                  className={`px-3 py-1 rounded ${!dmWelcomeEnabled ? 'bg-red-500 text-white' : 'bg-gray-300 text-black'}`}
                >
                  Off
                </button>
                <button
                  onClick={() => handleSave("welcomeDM")}
                  className="px-4 py-1 bg-purple-600 text-white rounded ml-2"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Server Welcome Channel */}
            <div className="flex flex-col mt-2">
              <label>Server Welcome Channel</label>
              <select
                value={selectedWelcomeChannel}
                onChange={e => setSelectedWelcomeChannel(e.target.value)}
                className="p-2 rounded border bg-white text-black dark:bg-zinc-700 dark:text-white"
              >
                <option value="">Select a channel</option>
                {channels.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Farewell Messages */}
          <div className="flex flex-col gap-4 mt-4">
            <h3 className="font-semibold text-lg">Farewell Messages</h3>
            <div className="flex flex-col">
              <label>Server Farewell</label>
              <input
                type="text"
                placeholder="Goodbye {usermention}!"
                value={messages.serverFarewell}
                onChange={e => handleChange("serverFarewell", e.target.value)}
                className="p-2 rounded border"
              />
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => setServerFarewellEnabled(true)}
                  className={`px-3 py-1 rounded ${serverFarewellEnabled ? 'bg-green-500 text-white' : 'bg-gray-300 text-black'}`}
                >
                  On
                </button>
                <button
                  onClick={() => setServerFarewellEnabled(false)}
                  className={`px-3 py-1 rounded ${!serverFarewellEnabled ? 'bg-red-500 text-white' : 'bg-gray-300 text-black'}`}
                >
                  Off
                </button>
                <button
                  onClick={() => handleSave("farewellServer")}
                  className="px-4 py-1 bg-purple-600 text-white rounded ml-2"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="flex flex-col mt-2">
              <label>DM Farewell</label>
              <input
                type="text"
                placeholder="Sad to see you go {username}!"
                value={messages.dmFarewell}
                onChange={e => handleChange("dmFarewell", e.target.value)}
                className="p-2 rounded border"
              />
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => setDmFarewellEnabled(true)}
                  className={`px-3 py-1 rounded ${dmFarewellEnabled ? 'bg-green-500 text-white' : 'bg-gray-300 text-black'}`}
                >
                  On
                </button>
                <button
                  onClick={() => setDmFarewellEnabled(false)}
                  className={`px-3 py-1 rounded ${!dmFarewellEnabled ? 'bg-red-500 text-white' : 'bg-gray-300 text-black'}`}
                >
                  Off
                </button>
                <button
                  onClick={() => handleSave("farewellDM")}
                  className="px-4 py-1 bg-purple-600 text-white rounded ml-2"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Server Farewell Channel */}
            <div className="flex flex-col mt-2">
              <label>Server Farewell Channel</label>
              <select
                value={selectedFarewellChannel}
                onChange={e => setSelectedFarewellChannel(e.target.value)}
                className="p-2 rounded border bg-white text-black dark:bg-zinc-700 dark:text-white"
              >
                <option value="">Select a channel</option>
                {channels.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Toast message */}
        {saveMessage && (
          <div className="fixed bottom-6 right-6 bg-green-500 text-white px-4 py-2 rounded shadow-lg">
            {saveMessage}
          </div>
        )}
      </div>
    );
  }

  // Default: show all servers
  return (
    <div className="min-h-screen px-6 py-8">
      <h1 className="text-3xl font-bold mb-6">SELECT YOUR SERVER</h1>

      {servers.length > 0 && (
        <div className="p-6 bg-zinc-200 dark:bg-zinc-800 rounded-xl shadow flex flex-col gap-4 mb-6">
          <h2 className="font-bold text-xl">Your Servers</h2>
          {servers.map(g => (
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
                  onClick={() => handleDashboard(g.id)}
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

export default Dashboard;
