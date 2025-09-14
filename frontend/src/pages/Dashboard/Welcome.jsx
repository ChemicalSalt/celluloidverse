import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const Welcome = () => {
  const { serverId } = useParams();
  const [token, setToken] = useState(null);
  const [messages, setMessages] = useState({ serverWelcome: "", dmWelcome: "" });
  const [channels, setChannels] = useState([]);
  const [selectedWelcomeChannel, setSelectedWelcomeChannel] = useState("");
  const [serverWelcomeEnabled, setServerWelcomeEnabled] = useState(true);
  const [dmWelcomeEnabled, setDmWelcomeEnabled] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    setToken(t);
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchChannels = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/dashboard/servers/${serverId}/channels`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        setChannels(data);
        setSelectedWelcomeChannel("");
      } catch (err) {
        console.error(err);
      }
    };

    fetchChannels();
  }, [serverId, token]);

  useEffect(() => {
    if (!token) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/dashboard/servers/${serverId}/messages`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        setMessages({ serverWelcome: data.serverWelcome || "", dmWelcome: data.dmWelcome || "" });
      } catch (err) {
        console.error(err);
      }
    };

    fetchMessages();
  }, [serverId, token]);

  const handleChange = (field, value) => {
    setMessages((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (feature) => {
    try {
      let payload = {};
      if (feature === "welcomeServer") {
        payload = { welcome: { enabled: serverWelcomeEnabled, channelId: selectedWelcomeChannel, serverMessage: messages.serverWelcome } };
      } else if (feature === "welcomeDM") {
        payload = { welcome: { dmEnabled: dmWelcomeEnabled, dmMessage: messages.dmWelcome } };
      }

      await fetch(`${import.meta.env.VITE_API_URL}/dashboard/servers/${serverId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setSaveMessage("Saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setSaveMessage("Failed to save messages. Try again.");
    }
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <h1 className="text-3xl font-bold mb-6">Welcome Plugin</h1>

      {/* Server Welcome */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col">
          <label>Server Welcome Channel</label>
          <select value={selectedWelcomeChannel} onChange={(e) => setSelectedWelcomeChannel(e.target.value)}>
            <option value="">Select a channel</option>
            {channels.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col mt-2">
          <label>Server Welcome Message</label>
          <input type="text" placeholder="Welcome {usermention}!" value={messages.serverWelcome} onChange={(e) => handleChange("serverWelcome", e.target.value)} />
          <div className="flex items-center gap-2 mt-1">
            <button onClick={() => setServerWelcomeEnabled(true)} className={`px-3 py-1 rounded ${serverWelcomeEnabled ? "bg-green-500 text-white" : "bg-gray-300 text-black"}`}>
              On
            </button>
            <button onClick={() => setServerWelcomeEnabled(false)} className={`px-3 py-1 rounded ${!serverWelcomeEnabled ? "bg-red-500 text-white" : "bg-gray-300 text-black"}`}>
              Off
            </button>
            <button onClick={() => handleSave("welcomeServer")} className="px-4 py-1 bg-purple-600 text-white rounded ml-2">
              Save
            </button>
          </div>
        </div>

        {/* DM Welcome */}
        <div className="flex flex-col mt-2">
          <label>DM Welcome Message</label>
          <input type="text" placeholder="Hi {username}!" value={messages.dmWelcome} onChange={(e) => handleChange("dmWelcome", e.target.value)} />
          <div className="flex items-center gap-2 mt-1">
            <button onClick={() => setDmWelcomeEnabled(true)} className={`px-3 py-1 rounded ${dmWelcomeEnabled ? "bg-green-500 text-white" : "bg-gray-300 text-black"}`}>
              On
            </button>
            <button onClick={() => setDmWelcomeEnabled(false)} className={`px-3 py-1 rounded ${!dmWelcomeEnabled ? "bg-red-500 text-white" : "bg-gray-300 text-black"}`}>
              Off
            </button>
            <button onClick={() => handleSave("welcomeDM")} className="px-4 py-1 bg-purple-600 text-white rounded ml-2">
              Save
            </button>
          </div>
        </div>
      </div>

      {saveMessage && <div className="fixed bottom-6 right-6 bg-green-500 text-white px-4 py-2 rounded shadow-lg">{saveMessage}</div>}
    </div>
  );
};

export default Welcome;
