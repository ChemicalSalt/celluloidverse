const About = () => {
  return (
    <main className="min-h-screen bg-white text-black dark:bg-black dark:text-white px-6 sm:px-12 md:px-24 lg:px-32 pt-16 transition-colors duration-300">
      <div className="max-w-full sm:max-w-2xl md:max-w-3xl mx-auto text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
          About Celluloidverse
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
          Welcome to <span className="font-semibold">Celluloidverse</span> — your place to access and use the features of the Celluloidverse bot while enjoying engaging video content. Configure server settings, explore available commands, and stay connected with our latest videos and shorts from YouTube.
        </p>

        <p className="mt-6 sm:mt-8 text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
          Whether you want to manage your bot’s features or watch short clips and full videos, Celluloidverse brings all your interactive entertainment and dashboard tools together in one seamless experience.
        </p>
      </div>
    </main>
  );
};

export default About;
