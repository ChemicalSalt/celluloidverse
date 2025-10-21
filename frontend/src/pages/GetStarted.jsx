import { useState } from "react";
import { motion } from "framer-motion";

const GetStarted = () => {
  const [step, setStep] = useState(1);

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const externalLink = (url) => {
    window.open(url, "_blank");
    setTimeout(() => handleNext(), 5000);
  };

  const steps = [
    {
      title: "Welcome to Celluloidverse",
      desc: "Ready to explore our universe?",
      button: { text: "Let's go", action: handleNext },
    },
    {
      title: "Explore: Dashboard",
      link: "/dashboard",
      button: { text: "Next", action: handleNext },
    },
    {
      title: "Explore: Shorts Page",
      link: "/shorts",
      button: { text: "Next", action: handleNext },
    },
    {
      title: "Explore: Videos Page",
      link: "/videos",
      button: { text: "Next", action: handleNext },
    },
    {
      title: "Explore: About Page",
      link: "/about",
      button: { text: "Next", action: handleNext },
    },
    {
      title: "Explore: Contact Page",
      link: "/contact",
      button: { text: "Next", action: handleNext },
    },
    {
      title: "Subscribe to our YouTube?",
      desc: "You'll be asked to follow us on Instagram next.",
      button: { text: "Yes", action: () => externalLink("https://youtube.com/@Celluloidverse") },
      skip: handleNext,
      color: "bg-red-600",
    },
    {
      title: "Follow us on Instagram?",
      desc: "You'll be asked to join our Discord next.",
      button: { text: "Yes", action: () => externalLink("https://instagram.com/celluloidverse") },
      skip: handleNext,
      color: "bg-pink-500",
    },
    {
      title: "Join our Discord server?",
      desc: "Final step!",
      button: { text: "Join Now", action: () => externalLink("https://discord.gg/kxmZsh9GUT") },
      skip: handleNext,
      color: "bg-indigo-600",
    },
    {
      title: "You're all set!",
      desc: "Thanks for exploring Celluloidverse",
      button: { text: "Close", action: () => window.history.back() },
    },
  ];

  const current = steps[step - 1];

  return (
    <main className="bg-gradient-to-b from-zinc-50 to-zinc-200 dark:from-zinc-950 dark:to-zinc-900 text-black dark:text-white min-h-screen flex flex-col items-center justify-start px-4 transition-colors duration-300 pt-16">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl p-8 rounded-2xl max-w-lg w-full shadow-xl border border-zinc-200 dark:border-zinc-800 flex flex-col gap-6 transition-all duration-500"
      >
        {/* Back Button */}
        {step > 1 && (
          <button
            onClick={handleBack}
            className="mb-2 self-start px-4 py-1 rounded-full bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white shadow hover:underline transition"
          >
            ← Back
          </button>
        )}

        {/* Title & Description */}
        <h2 className="text-2xl font-bold text-center">{current.title}</h2>
        {current.desc && <p className="text-center text-zinc-600 dark:text-zinc-400">{current.desc}</p>}

        {/* Link if exists */}
        {current.link && (
          <a
            href={current.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline text-center"
          >
            Open {current.title.split(": ")[1]}
          </a>
        )}

        {/* Main Button */}
        <button
          onClick={current.button.action}
          className={`mt-4 px-6 py-2 rounded-full font-semibold text-white dark:text-black transition-all duration-300 shadow-lg ${
            current.color
              ? `${current.color} hover:opacity-90`
              : "bg-black dark:bg-white hover:opacity-90"
          }`}
        >
          {current.button.text}
        </button>

        {/* Skip button if exists */}
        {current.skip && (
          <button
            onClick={current.skip}
            className="text-sm text-gray-500 dark:text-gray-400 underline mt-2"
          >
            Skip
          </button>
        )}
      </motion.div>
    </main>
  );
};

export default GetStarted;
