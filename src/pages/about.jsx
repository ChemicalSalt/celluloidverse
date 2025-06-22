const About = () => {
  return (
    <main className="min-h-screen bg-white text-black dark:bg-black dark:text-white px-6 py-12 flex flex-col items-center justify-center transition-colors duration-300">
      <div className="max-w-3xl text-center">
        <h1 className="text-4xl font-bold mb-6">About Celluloidverse</h1>

        <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
          Welcome to <span className="text-black dark:text-white font-semibold">Celluloidverse</span> — a universe of AI-powered storytelling and entertainment. We create short films, animations, and interactive videos using cutting-edge tools like AI, machine learning, and creative scripting.
        </p>

        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
          Whether you're a fan of thrilling mysteries, emotional dramas, or experimental art, Celluloidverse is your place to explore next-generation narratives that push boundaries.
        </p>
      </div>
    </main>
  );
};

export default About;
