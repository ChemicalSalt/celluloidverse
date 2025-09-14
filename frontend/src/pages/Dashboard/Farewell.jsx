import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const Farewell = () => {
  const { serverId } = useParams();
  const [token, setToken] = useState(null);
  const [messages, setMessages] = useState({ serverFarewell: "", dmFarewell: "" });
  const [channels, setChannels] = useState([]);
  const [selectedFarewellChannel, setSelectedFarewellChannel] = useState("");
  const [serverFarewellEnabled, setServerFarewellEnabled] = useState(true);
  const [dmFarewellEnabled, setDmFarewellEnabled] = useState(true);
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
        setSelectedFarewellChannel("");
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
        setMessages({ serverFarewell: data.serverFarewell || "", dmFarewell: data.dmFarewell || "" });
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
      if (feature === "farewellServer") {
        payload = { farewell: { enabled: serverFarewellEnabled, channelId: selectedFarewellChannel, serverMessage: messages.serverFarewell } };
      } else if (feature === "farewellDM") {
        payload = { farewell: { dmEnabled: dmFarewellEnabled, dmMessage: messages.dmFarewell } };
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
      <h1 className="text-3xl font-bold mb-6">Farewell Plugin</h1>

      {/* Server Farewell */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col">
          <label>Server Farewell Channel</label>
          <select value={selectedFarewellChannel} onChange={(e) => setSelectedFarewellChannel(e.target.value)}>
            <option value="">Select a channel</option>
            {channels.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col mt-2">
          <label>Server Farewell Message</label>
          <input type="text" placeholder="Goodbye {usermention}!" value={messages.serverFarewell} onChange={(e) => handleChange("serverFarewell", e.target.value)} />
          <div className="flex items-center gap-2 mt-1">
            <button onClick={() => setServerFarewellEnabled(true)} className={`px-3 py-1 rounded ${serverFarewellEnabled ? "bg-green-500 text-white" : "bg-gray-300 text-black"}`}>
              On
            </button>
            <button onClick={() => setServerFarewellEnabled(false)} className={`px-3 py-1 rounded ${!serverFarewellEnabled ? "bg-red-500 text-white" : "bg-gray-300 text-black"}`}>
              Off
            </button>
            <button onClick={() => handleSave("farewellServer")} className="px-4 py-1 bg-purple-600 text-white rounded ml-2">
              Save
            </button>
          </div>
        </div>

        {/* DM Farewell */}
        <div className="flex flex-col mt-2">
          <label>DM Farewell Message</label>
          <input type="text" placeholder="Sad to see you go {username}!" value={messages.dmFarewell} onChange={(e) => handleChange("dmFarewell", e.target.value)} />
          <div className="flex items-center gap-2 mt-1">
            <button onClick={() => setDmFarewellEnabled(true)} className={`px-3 py-1 rounded ${dmFarewellEnabled ? "bg-green-500 text-white" : "bg-gray-300 text-black"}`}>
              On
            </button>
            <button onClick={() => setDmFarewellEnabled(false)} className={`px-3 py-1 rounded ${!dmFarewellEnabled ? "bg-red-500 text-white" : "bg-gray-300 text-black"}`}>
              Off
            </button>
            <button onClick={() => handleSave("farewellDM")} className="px-4 py-1 bg-purple-600 text-white rounded ml-2">
              Save
            </button>
          </div>
        </div>
      </div>

      {saveMessage && <div className="fixed bottom-6 right-6 bg-green-500 text-white px-4 py-2 rounded shadow-lg">{saveMessage}</div>}
    </div>
  );
};

export default Farewell;
