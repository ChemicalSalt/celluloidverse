import { useState } from "react";

const GetStartedModal = ({ onClose }) => {
  const [step, setStep] = useState(1);

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const externalLink = (url) => {
    window.open(url, "_blank");
    setTimeout(() => handleNext(), 5000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50">
      {/* Always-visible back button */}
      <button
        onClick={step === 1 ? onClose : handleBack}
        className="fixed top-4 left-4 z-50 bg-white dark:bg-black text-black dark:text-white px-4 py-1 rounded-full shadow hover:underline"
      >
        ← Back
      </button>

      <div className="h-full w-full flex items-center justify-center">
        <div className="bg-white dark:bg-black text-black dark:text-white p-8 rounded-2xl max-w-lg w-full shadow-xl transition-colors duration-300">
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
              <a href="/shorts" className="text-blue-500 underline" target="_blank">Open Shorts Page</a>
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
              <a href="/videos" className="text-blue-500 underline" target="_blank">Open Videos Page</a>
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
              <a href="/about" className="text-blue-500 underline" target="_blank">Open About Page</a>
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
              <a href="/contact" className="text-blue-500 underline" target="_blank">Open Contact Page</a>
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
                onClick={onClose}
                className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-full transition"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GetStartedModal;
