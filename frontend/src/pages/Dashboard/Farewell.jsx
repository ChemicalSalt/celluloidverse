import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";

const Farewell = () => {
  const { serverId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [messages, setMessages] = useState({ serverMessage: "", dmMessage: "" });
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState("");
  const [serverEnabled, setServerEnabled] = useState(true);
  const [dmEnabled, setDmEnabled] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (!serverId || !token) return;

    const fetchData = async () => {
      try {
        // Fetch channels
        const resChannels = await fetch(`${import.meta.env.VITE_API_URL}/dashboard/servers/${serverId}/channels`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dataChannels = await resChannels.json();
        setChannels(dataChannels);

        // Fetch plugin data
        const resPlugin = await fetch(`${import.meta.env.VITE_API_URL}/dashboard/servers/${serverId}/plugins/farewell`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dataPlugin = await resPlugin.json();

        setMessages({
          serverMessage: dataPlugin.serverMessage || "",
          dmMessage: dataPlugin.dmMessage || "",
        });
        setSelectedChannel(dataPlugin.channelId || "");
        setServerEnabled(dataPlugin.enabled ?? true);
        setDmEnabled(dataPlugin.dmEnabled ?? true);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [serverId, token]);

  const handleSave = async () => {
    try {
      const payload = {
        enabled: serverEnabled,
        channelId: selectedChannel,
        serverMessage: messages.serverMessage,
        dmEnabled,
        dmMessage: messages.dmMessage,
      };

      await fetch(`${import.meta.env.VITE_API_URL}/dashboard/servers/${serverId}/plugins/farewell`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
      <h1 className="text-3xl font-bold mb-6">Configure Farewell Messages</h1>
      <div className="flex flex-col gap-4">
        <label>Server Farewell Channel</label>
        <select
          value={selectedChannel}
          onChange={e => setSelectedChannel(e.target.value)}
          className="p-2 border rounded bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a channel</option>
          {channels.map(c => (
            <option key={c.id} value={c.id} className="bg-gray-800 text-white">{c.name}</option>
          ))}
        </select>

        <label>Server Farewell</label>
        <textarea
          value={messages.serverMessage}
          onChange={e => handleChange("serverMessage", e.target.value)}
          className="p-2 border rounded resize-none"
          rows={3}
        />

        <label>DM Farewell</label>
        <textarea
          value={messages.dmMessage}
          onChange={e => handleChange("dmMessage", e.target.value)}
          className="p-2 border rounded resize-none"
          rows={3}
        />

        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setServerEnabled(!serverEnabled)}
            className={`px-3 py-1 rounded ${serverEnabled ? "bg-green-500 text-white" : "bg-gray-300 text-black"}`}
          >
            SERVER {serverEnabled ? "ON" : "OFF"}
          </button>
          <button
            onClick={() => setDmEnabled(!dmEnabled)}
            className={`px-3 py-1 rounded ${dmEnabled ? "bg-green-500 text-white" : "bg-gray-300 text-black"}`}
          >
            DM {dmEnabled ? "ON" : "OFF"}
          </button>
          <button onClick={handleSave} className="px-4 py-1 bg-purple-600 text-white rounded">SAVE</button>
        </div>
      </div>

      {saveMessage && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white px-4 py-2 rounded shadow-lg">
          {saveMessage}
        </div>
      )}
    </div>
  );
};

export default Farewell;
