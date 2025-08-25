import { useState, useEffect } from "react";

const Home = () => {
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);

  // 🔹 Bot status state
  const [status, setStatus] = useState(null);

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const externalLink = (url) => {
    window.open(url, "_blank");
    setTimeout(() => handleNext(), 5000);
  };

  // 🔹 Fetch bot status from backend
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("https://celluloidverse.onrender.com/api/status"); 
        const data = await res.json();
        setStatus(data);
      } catch (err) {
        console.error("Failed to fetch bot status:", err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // auto-refresh every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="bg-white text-black dark:bg-black dark:text-white min-h-screen flex flex-col items-center justify-start px-4 transition-colors duration-300 pt-16">
      
      {/* Home Section */}
      <section className="text-center w-full max-w-3xl">
        <h1 className="text-4xl font-bold mb-4 tracking-wide">
          Welcome to Celluloidverse
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
          Explore your bot dashboard and enjoy videos and shorts posted on our YouTube channel.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6 w-full">
          <button
            onClick={() => setShowModal(true)}
            className="w-full sm:w-48 px-6 py-3 rounded-full font-semibold transition-colors bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            Get Started
          </button>

          {/* 🔹 Status Button */}
          <button
            className={`w-full sm:w-48 px-6 py-3 rounded-full font-semibold transition-colors ${
              status?.online
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            {status
              ? status.online
                ? `Bot Online ✅ (${status.servers} servers)`
                : "Bot Offline ❌"
              : "Checking..."}
          </button>

          <button
            onClick={() => alert("Dashboard page coming soon!")}
            className="w-full sm:w-48 px-6 py-3 rounded-full font-semibold transition-colors bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            Dashboard
          </button>
        </div>

        {/* 🔹 Bot Details */}
        {status && (
          <div className="mt-8 p-6 bg-gray-100 dark:bg-gray-900 rounded-2xl shadow text-left w-full max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">Bot Status Details</h2>
            <p><strong>Online:</strong> {status.online ? "✅ Yes" : "❌ No"}</p>
            <p><strong>Servers:</strong> {status.servers}</p>
            <p><strong>Ping:</strong> {status.ping} ms</p>
            <p><strong>Last Updated:</strong> {new Date(status.timestamp).toLocaleTimeString()}</p>
          </div>
        )}
      </section>

      {/* Get Started Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
          {/* Back Button */}
          <button
            onClick={step === 1 ? () => setShowModal(false) : handleBack}
            className="fixed top-4 left-4 z-50 bg-white dark:bg-black text-black dark:text-white px-4 py-1 rounded-full shadow hover:underline"
          >
            ← Back
          </button>

          {/* Modal Content */}
          <div className="bg-white dark:bg-black text-black dark:text-white p-8 rounded-2xl max-w-lg w-full shadow-xl transition-colors duration-300">
            {/* Steps */}
            {step === 1 && (
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Welcome to Celluloidverse</h2>
                <p className="mb-6">Ready to explore our universe?</p>
                <button
                  onClick={handleNext}
                  className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-full transition"
                >
                  Let's go
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="text-center">
                <h2 className="text-xl font-bold mb-4">Explore: Shorts Page</h2>
                <a href="/shorts" className="text-blue-500 underline" target="_blank" rel="noopener noreferrer">Open Shorts Page</a>
                <button
                  onClick={handleNext}
                  className="block mt-6 bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-full transition"
                >
                  Next
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="text-center">
                <h2 className="text-xl font-bold mb-4">Explore: Videos Page</h2>
                <a href="/videos" className="text-blue-500 underline" target="_blank" rel="noopener noreferrer">Open Videos Page</a>
                <button
                  onClick={handleNext}
                  className="block mt-6 bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-full transition"
                >
                  Next
                </button>
              </div>
            )}

            {step === 4 && (
              <div className="text-center">
                <h2 className="text-xl font-bold mb-4">Explore: About Page</h2>
                <a href="/about" className="text-blue-500 underline" target="_blank" rel="noopener noreferrer">Open About Page</a>
                <button
                  onClick={handleNext}
                  className="block mt-6 bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-full transition"
                >
                  Next
                </button>
              </div>
            )}

            {step === 5 && (
              <div className="text-center">
                <h2 className="text-xl font-bold mb-4">Explore: Contact Page</h2>
                <a href="/contact" className="text-blue-500 underline" target="_blank" rel="noopener noreferrer">Open Contact Page</a>
                <button
                  onClick={handleNext}
                  className="block mt-6 bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-full transition"
                >
                  Next
                </button>
              </div>
            )}

            {step === 6 && (
              <div className="text-center">
                <h2 className="text-xl font-bold mb-2">Subscribe to our YouTube?</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">You'll be asked to follow us on Instagram next.</p>
                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={() => externalLink("https://youtube.com/@Celluloidverse")}
                    className="bg-red-600 text-white px-6 py-2 rounded-full w-40"
                  >
                    Yes
                  </button>
                  <button
                    onClick={handleNext}
                    className="text-sm text-gray-500 dark:text-gray-400 underline"
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}

            {step === 7 && (
              <div className="text-center">
                <h2 className="text-xl font-bold mb-2">Follow us on Instagram?</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">You'll be asked to join our Discord next.</p>
                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={() => externalLink("https://instagram.com/celluloidverse")}
                    className="bg-pink-500 text-white px-6 py-2 rounded-full w-40"
                  >
                    Yes
                  </button>
                  <button
                    onClick={handleNext}
                    className="text-sm text-gray-500 dark:text-gray-400 underline"
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}

            {step === 8 && (
              <div className="text-center">
                <h2 className="text-xl font-bold mb-2">Join our Discord server?</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Final step! 🎉</p>
                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={() => externalLink("https://discord.gg/kxmZsh9GUT")}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-full w-40"
                  >
                    Join Now
                  </button>
                  <button
                    onClick={handleNext}
                    className="text-sm text-gray-500 dark:text-gray-400 underline"
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}

            {step === 9 && (
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">You're all set!</h2>
                <p className="mb-6">Thanks for exploring Celluloidverse 🎉</p>
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-full transition"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default Home;
