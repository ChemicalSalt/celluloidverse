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

  if (!status)
    return (
      <p className="text-center mt-8 text-zinc-500 animate-pulse">
        Loading bot status...
      </p>
    );

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 pt-16 
                    bg-gradient-to-b from-zinc-50 to-zinc-200 dark:from-black dark:to-zinc-800
                    transition-colors duration-500">
      <h1 className="text-4xl font-bold mb-8 text-zinc-900 dark:text-zinc-100">
        Bot Status
      </h1>

      {/* Card with center gradient and colored signal */}
      <div className="bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-100
                      dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900
                      shadow-lg rounded-3xl p-8 w-full max-w-lg flex flex-col gap-6 
                      border border-zinc-300 dark:border-zinc-700 transition-all duration-300 hover:scale-[1.03]">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-zinc-800 dark:text-zinc-100">Signal:</span>
          <span className={`font-semibold ${status.online ? 'text-green-400' : 'text-red-400'}`}>
            {status.online ? "Online" : "Offline"}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="font-semibold text-zinc-800 dark:text-zinc-100">Ping:</span>
          <span className="font-mono text-zinc-800 dark:text-zinc-100">{status.ping} ms</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="font-semibold text-zinc-800 dark:text-zinc-100">Servers:</span>
          <span className="font-mono text-zinc-800 dark:text-zinc-100">{status.servers}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="font-semibold text-zinc-800 dark:text-zinc-100">Last Update:</span>
          <span className="font-mono text-zinc-800 dark:text-zinc-100">
            {new Date(status.timestamp).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BotStatus;
