import { motion } from "framer-motion";

const about = () => {
  return (
    <main
      className="min-h-screen w-full flex flex-col items-center justify-start px-6 py-20
      bg-[linear-gradient(180deg,_#f4f4f5_0%,_#e4e4e7_25%,_#d4d4d8_50%,_#e4e4e7_75%,_#f4f4f5_100%)]
      dark:bg-[linear-gradient(180deg,_#000_0%,_#111_25%,_#1c1c1c_50%,_#111_75%,_#000_100%)]
      text-black dark:text-zinc-100 transition-colors duration-700 relative overflow-hidden"
    >
      {/* Soft gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-200/30 to-transparent dark:via-zinc-800/30 pointer-events-none -z-10" />

      <section className="max-w-4xl text-center space-y-10 relative z-10">
        {/* Title */}
        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          About <span className="bg-clip-text text-transparent bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-800 dark:from-white dark:via-zinc-300 dark:to-white">Celluloidverse</span>
        </motion.h1>

        {/* Description */}
        <motion.p
          className="text-lg sm:text-xl md:text-2xl leading-relaxed text-gray-700 dark:text-gray-300"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
        >
          Welcome to <span className="font-semibold text-zinc-900 dark:text-white">Celluloidverse</span> — your all-in-one dashboard for our Discord bot. Manage your server with plugins like{" "}
          <span className="font-medium text-gray-500 dark:text-gray-400">Welcoming, Farewell</span>,{" "}
          <span className="font-medium text-gray-500 dark:text-gray-400">Language</span> and explore our{" "}
          <span className="font-medium text-gray-500 dark:text-gray-400">YouTube content</span> directly here.
        </motion.p>

        <motion.p
          className="text-lg sm:text-xl md:text-2xl leading-relaxed text-gray-700 dark:text-gray-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1 }}
        >
          Connect your Discord server, customize features and explore our{" "}
          <span className="font-medium text-gray-500 dark:text-gray-400">YouTube content</span> directly within the site.  
          The Celluloidverse dashboard brings together automation, creativity and simplicity - made
          for communities that love staying active, inspired and connected.
        </motion.p>

        {/* Subtle Divider */}
        <motion.div
          className="my-10 h-px w-2/3 mx-auto bg-gradient-to-r from-transparent via-zinc-500 to-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.3 }}
        />
      </section>
    </main>
  );
};

export default about;
