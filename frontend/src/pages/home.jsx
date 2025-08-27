import { useState, useEffect } from "react";

const Home = () => {
  const [status, setStatus] = useState(null);

  // Determine correct API URL for local vs production
  const API_URL = import.meta.env.DEV
    ? "http://localhost:5000/api/status"
    : "https://celluloidverse.onrender.com/api/status";

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

  return (
    <main className="bg-white text-black dark:bg-black dark:text-white min-h-screen flex flex-col items-center justify-start px-4 transition-colors duration-300 pt-16">
      <section className="text-center w-full max-w-3xl">
        <h1 className="text-4xl font-bold mb-4 tracking-wide">
          Welcome to Celluloidverse
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
          Explore your bot dashboard and enjoy videos and shorts posted on our YouTube channel.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6 w-full">
          <button
            onClick={() => window.location.href = "/getstarted"}
            className="w-full sm:w-48 px-6 py-3 rounded-full font-semibold transition-colors bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            Get Started
          </button>

           <button
    onClick={() => window.location.href = "/botstatus"}
    className="w-full sm:w-48 px-6 py-3 rounded-full font-semibold transition-colors bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
  >
    Bot Status
  </button>


          <button
  onClick={() => window.location.href = "http://localhost:5000/api/dashboard/login"}
  className="w-full sm:w-48 px-6 py-3 rounded-full font-semibold transition-colors bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
>
  Dashboard
</button>

        </div>
      </section>
    </main>
  );
};

export default Home;


