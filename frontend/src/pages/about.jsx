const About = () => {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-20 bg-gradient-to-b from-zinc-50 to-zinc-200 dark:from-black dark:to-zinc-900 text-black dark:text-white transition-all duration-300">
      
      <section className="max-w-4xl text-center space-y-8">
        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-black to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
            About Celluloidverse
          </span>
        </h1>

        {/* Description */}
        <p className="text-base sm:text-lg md:text-xl leading-relaxed text-gray-700 dark:text-gray-400">
          Welcome to <span className="font-semibold text-black dark:text-white">Celluloidverse</span> — your creative hub for everything cinematic and digital.  
          This platform lets you explore the <span className="font-medium">Celluloidverse Bot</span>, configure server tools, and stay tuned with our latest videos and shorts.
        </p>

        <p className="text-base sm:text-lg md:text-xl leading-relaxed text-gray-700 dark:text-gray-400">
          Our mission is to merge <span className="font-medium">storytelling</span> and <span className="font-medium">technology</span> — creating a space where creators, fans, and servers come together.  
          Whether you're managing your bot’s settings or exploring new media, the experience is designed to be seamless, inspiring, and beautifully minimal.
        </p>

        {/* Subtle Divider */}
        <div className="my-10 h-px w-2/3 mx-auto bg-gradient-to-r from-transparent via-zinc-400 dark:via-zinc-600 to-transparent" />

        
      </section>
    </main>
  );
};

export default About;
