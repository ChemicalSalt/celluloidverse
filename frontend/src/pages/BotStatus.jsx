import { useState, useEffect } from "react";

const BotStatus = () => {
  const [status, setStatus] = useState(null);

  const API_URL = import.meta.env.DEV
    ? "http://localhost:5000/api/status"
    : "https://celluloidverse-5c0i.onrender.com/api/status";

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(API_URL);
        const data = await res.json();
        setStatus(data);
      } catch (err) {
        console.error("Failed to fetch bot status:", err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!status) return <p className="text-center mt-8">Loading bot status...</p>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 pt-16">
      <h1 className="text-4xl font-bold mb-6">Bot Status</h1>

      {/* Single box wrapper */}
<div className="bg-zinc-100 dark:bg-zinc-800 shadow-xl rounded-2xl p-8 w-full max-w-lg flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <span className="font-semibold">Signal:</span>
          <span className={status.online ? "text-green-600" : "text-red-600"}>
            {status.online ? "Online" : "Offline"}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="font-semibold">Ping:</span>
          <span>{status.ping} ms</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="font-semibold">Servers:</span>
          <span>{status.servers}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="font-semibold">Last Update:</span>
          <span>{new Date(status.timestamp).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default BotStatus;
