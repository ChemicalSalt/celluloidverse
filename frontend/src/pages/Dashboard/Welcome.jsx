import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";

const Welcome = () => {
  const { serverId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [messages, setMessages] = useState({ serverWelcome: "", dmWelcome: "" });
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState("");
  const [serverEnabled, setServerEnabled] = useState(true);
  const [dmEnabled, setDmEnabled] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (!serverId || !token) return;

    const fetchData = async () => {
      try {
        const resChannels = await fetch(`${import.meta.env.VITE_API_URL}/dashboard/servers/${serverId}/channels`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dataChannels = await resChannels.json();
        setChannels(dataChannels);

        const resMessages = await fetch(`${import.meta.env.VITE_API_URL}/dashboard/servers/${serverId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dataMessages = await resMessages.json();
        setMessages({ serverWelcome: "", dmWelcome: "" });
        setSelectedChannel("");
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [serverId, token]);

  const handleSave = async () => {
    try {
      const payload = {
        welcome: {
          enabled: serverEnabled,
          channelId: selectedChannel,
          serverMessage: messages.serverWelcome,
          dmEnabled,
          dmMessage: messages.dmWelcome,
        },
      };
      await fetch(`${import.meta.env.VITE_API_URL}/dashboard/servers/${serverId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setSaveMessage("Saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setSaveMessage("Failed to save messages");
    }
  };

  const handleChange = (field, value) => {
    setMessages(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <h1 className="text-3xl font-bold mb-6">Configure Welcome Messages</h1>
      <div className="flex flex-col gap-4">
        <label>Server Welcome Channel</label>
        <select value={selectedChannel} onChange={e => setSelectedChannel(e.target.value)} className="p-2 border rounded">
          <option value="">Select a channel</option>
          {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <label>Server Welcome</label>
        <input type="text" value={messages.serverWelcome} onChange={e => handleChange("serverWelcome", e.target.value)} className="p-2 border rounded" />

        <label>DM Welcome</label>
        <input type="text" value={messages.dmWelcome} onChange={e => handleChange("dmWelcome", e.target.value)} className="p-2 border rounded" />

        <div className="flex gap-2 mt-2">
          <button onClick={() => setServerEnabled(!serverEnabled)} className={`px-3 py-1 rounded ${serverEnabled ? 'bg-green-500 text-white' : 'bg-gray-300 text-black'}`}>Server {serverEnabled ? "On" : "Off"}</button>
          <button onClick={() => setDmEnabled(!dmEnabled)} className={`px-3 py-1 rounded ${dmEnabled ? 'bg-green-500 text-white' : 'bg-gray-300 text-black'}`}>DM {dmEnabled ? "On" : "Off"}</button>
          <button onClick={handleSave} className="px-4 py-1 bg-purple-600 text-white rounded">Save</button>
        </div>
      </div>

      {saveMessage && <div className="fixed bottom-6 right-6 bg-green-500 text-white px-4 py-2 rounded shadow-lg">{saveMessage}</div>}
    </div>
  );
};

export default Welcome;
