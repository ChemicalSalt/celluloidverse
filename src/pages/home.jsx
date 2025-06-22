import { useState } from "react";
import GetStartedModal from "../components/GetStartedModal";

const Home = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <main className="bg-white text-black dark:bg-black dark:text-white min-h-screen flex flex-col items-center justify-start pt-32 px-4 transition-colors duration-300">
      <section className="text-center">
        <h1 className="text-4xl font-bold mb-4 tracking-wide">
          Welcome to Celluloidverse
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-xl">
          Dive into an AI-powered universe of storytelling — from short thrills to cinematic experiences.
        </p>

        <button
          onClick={() => setShowModal(true)}
            className="mt-6 px-6 py-3 rounded-full font-semibold transition-colors bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700"
        >
          Get Started
        </button>
      </section>

      {showModal && <GetStartedModal onClose={() => setShowModal(false)} />}
    </main>
  );
};

export default Home;
