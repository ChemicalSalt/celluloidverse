import { useState, useEffect } from "react";
import { motion } from "framer-motion";

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
      dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 dark:text-zinc-100 relative overflow-hidden"
    >
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-6 h-6 rounded-full bg-zinc-300 dark:bg-zinc-700 opacity-10 animate-float-slow
              ${i % 2 === 0 ? "left-[15%] top-[25%]" : "left-[75%] top-[65%]"} 
              blur-xl`}
            style={{ animationDelay: `${i * 0.5}s` }}
          ></div>
        ))}
      </div>

      {/* Gradient overlay waves */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="w-[200%] h-[200%] absolute top-[-50%] left-[-50%] bg-gradient-to-tr from-zinc-200/20 via-zinc-400/20 to-zinc-200/20 rounded-full blur-[120px] animate-wave-slow"></div>
        <div className="w-[150%] h-[150%] absolute bottom-[-25%] right-[-25%] bg-gradient-to-br from-zinc-300/20 via-zinc-500/20 to-zinc-300/20 rounded-full blur-[100px] animate-wave-slower"></div>
      </div>

      <section className="flex flex-col items-center justify-center text-center px-6 py-24 space-y-24 w-full max-w-4xl relative z-10">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1
            className="text-5xl sm:text-6xl font-extrabold mb-6 tracking-tight leading-tight bg-clip-text text-transparent
            bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-800 dark:from-zinc-200 dark:via-zinc-400 dark:to-zinc-300"
          >
            Celluloidverse Dashboard
          </h1>
        </motion.div>

        {/* Login Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
        >
          <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed max-w-2xl mx-auto mb-10">
            Easily manage your Discord servers, connect plugins and track
            everything in one place - simple, fast and built for your needs.
          </p>
          <FancyButton
            text="Login with Discord"
            onClick={() =>
              (window.location.href = `${API_URL}/dashboard/auth/login`)
            }
          />
        </motion.div>

        {/* Status Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1 }}
        >
          <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed max-w-2xl mx-auto mb-10">
            Check your bot’s live status anytime. See when it’s online, monitor
            performance and get instant updates - no refresh needed.
          </p>
          <FancyButton
            text="Check Bot Status"
            onClick={() => (window.location.href = "/botstatus")}
          />
        </motion.div>

        {/* Commands Docs Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.3 }}
        >
          <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed max-w-2xl mx-auto mb-10">
            Want to explore all available commands and learn how to use them?
          </p>
          <FancyButton
            text="Commands Docs"
            onClick={() => (window.location.href = "/commands-docs")}
          />
        </motion.div>
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
      hover:scale-105 hover:shadow-[0_0_25px_rgba(255,255,255,0.1)] dark:hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]
      before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-r before:from-zinc-400 before:via-zinc-200 before:to-zinc-500
      before:opacity-0 before:group-hover:opacity-70 before:blur-xl before:transition-opacity before:duration-500"
  >
    <span className="relative z-10">{text}</span>
  </button>
);

export default Dashboard;
