import { useState, useEffect } from "react";

const Dashboard = () => {
  const [status, setStatus] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL;

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
  }, [API_URL]);

  return (
    <main
      className="min-h-screen w-full flex flex-col items-center justify-center overflow-x-hidden transition-colors duration-700
      bg-gradient-to-b from-zinc-100 via-zinc-50 to-zinc-100 text-zinc-900
      dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 dark:text-zinc-100"
    >
      <section className="flex flex-col items-center justify-center text-center px-6 py-24 space-y-24 w-full max-w-4xl">
        {/* Dashboard section */}
         <div>
    <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 tracking-tight leading-tight">
      Welcome to Celluloidverse Dashboard
      </h1>
        </div>

        {/* Dashboard button */}
        <div>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed max-w-2xl mx-auto mb-10">
            Easily manage your Discord servers, connect plugins and track everything in one place - simple, fast and built for your needs.
          </p>
          <FancyButton
            text="Login with Discord"
            onClick={() =>
              (window.location.href = `${API_URL}/dashboard/auth/login`)
            }
          />
        </div>

        {/* Status section */}
        <div>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed max-w-2xl mx-auto mb-10">
           Check your bot’s live status anytime. See when it’s online, monitor performance and get instant updates - no refresh needed.
          </p>
          <FancyButton
            text="Check Bot Status"
            onClick={() => (window.location.href = "/botstatus")}
          />
        </div>
      </section>
    </main>
  );
};

/* Fancy button */
const FancyButton = ({ text, onClick }) => (
  <button
    onClick={onClick}
    className="relative px-10 py-4 rounded-full font-semibold tracking-wide overflow-hidden
      transition-all duration-300 group
      bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900
      hover:scale-105 hover:shadow-[0_0_25px_rgba(255,255,255,0.1)] dark:hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
  >
    <span className="relative z-10">{text}</span>
    <span
      className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 blur-xl
      bg-gradient-to-r from-zinc-400 via-zinc-200 to-zinc-500 
      dark:from-zinc-700 dark:via-zinc-400 dark:to-zinc-700
      transition-all duration-500"
    ></span>
  </button>
);

export default Dashboard;
