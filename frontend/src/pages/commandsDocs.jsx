import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const allPlugins = {
  moderation: [
    {
      name: "Auto-Moderation",
      description:
        "Automatically detects spam, bad words, and rule violations to keep your community safe.",
      guide:
        "Set filters for words, links, or mentions. Adjust punishments such as timeout, mute, or kick. (Placeholder — detailed setup coming soon.)",
    },
    {
      name: "Mute / Unmute",
      description:
        "Allows moderators to temporarily or permanently mute members across all channels.",
      guide:
        "You can configure mute duration, assign roles with mute permission, and customize mute messages. (Placeholder — configuration examples later.)",
    },
  ],
  automation: [
    {
      name: "Language",
      description:
        "Detects or translates messages automatically for multilingual servers.",
      guide:
        "Set the default translation language and choose which channels auto-translate. (Placeholder — examples soon.)",
    },
    {
      name: "Scheduler",
      description:
        "Schedules automatic tasks like announcements, messages, or reminders.",
      guide:
        "Configure the time zone, frequency, and message content. (Placeholder — setup screenshots later.)",
    },
    {
      name: "Welcome",
      description:
        "Sends a welcome message when new members join your server.",
      guide:
        "Use placeholders like {user} and {server} to personalize messages. Choose the target channel. (Placeholder — examples later.)",
    },
    {
      name: "Farewell",
      description: "Sends a message when someone leaves your server.",
      guide:
        "Customize the farewell text and decide whether it's public or logged. (Placeholder — message templates later.)",
    },
  ],
  utility: [
    {
      name: "Polls",
      description: "Quickly create polls to gather community opinions.",
      guide:
        "Choose poll type, duration, and result visibility. (Placeholder — usage examples later.)",
    },
    {
      name: "Server Info",
      description:
        "Displays server stats like member count, boost level, and uptime.",
      guide:
        "You can customize which stats appear. (Placeholder — metrics table soon.)",
    },
    {
      name: "Invite Tracker",
      description:
        "Tracks invites and shows who invited new members.",
      guide:
        "View leaderboard, reward top inviters with roles. (Placeholder — guide later.)",
    },
    {
      name: "Reaction Roles",
      description:
        "Gives members roles automatically when they react to messages.",
      guide:
        "Pick emojis and roles to link. Supports multiple categories. (Placeholder — mapping guide soon.)",
    },
  ],
  entertainment: [
    {
      name: "Games",
      description: "Lets members play mini-games in chat.",
      guide:
        "Enable channels for games, set cooldowns, view scoreboards. (Placeholder — supported games soon.)",
    },
    {
      name: "Memes",
      description: "Fetches random memes from safe sources.",
      guide:
        "Set content filters and choose source platforms. (Placeholder — source list later.)",
    },
    {
      name: "Music",
      description: "Streams high-quality music into voice channels.",
      guide:
        "Select music source, manage queue, and set playback permissions. (Placeholder — advanced controls later.)",
    },
  ],
};

const categories = {
  moderation: "Moderation",
  automation: "Automation",
  utility: "Utility",
  entertainment: "Entertainment",
};

const CommandsDocs = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);

  return (
    <main className="min-h-screen w-full px-6 py-20 bg-white dark:bg-black text-black dark:text-white transition-colors duration-700">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-5xl mx-auto"
      >
        {/* Back button (only visible inside category) */}
        {selectedCategory && (
          <button
            onClick={() => setSelectedCategory(null)}
            className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 mb-6"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
        )}

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-extrabold mb-8 text-center">
          Commands Documentation
        </h1>

        {/* Category Selection or Plugin Details */}
        {!selectedCategory ? (
          <>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg mb-12 text-center max-w-2xl mx-auto">
              Select a category to view all plugin guides and their usage.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {Object.entries(categories).map(([key, name]) => (
                <motion.div
                  key={key}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCategory(key)}
                  className="cursor-pointer border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-8 shadow-sm hover:shadow-md transition"
                >
                  <h2 className="text-2xl font-semibold mb-2">{name}</h2>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    View all plugin descriptions and usage info under this category.
                  </p>
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold mb-8 text-center">
              {categories[selectedCategory]} Plugins
            </h2>

            <div className="space-y-6">
              {allPlugins[selectedCategory].map((plugin) => (
                <motion.div
                  key={plugin.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 rounded-xl p-6 hover:shadow-md transition"
                >
                  <h3 className="text-xl font-semibold mb-2">{plugin.name}</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 mb-3">
                    {plugin.description}
                  </p>
                  <p className="text-zinc-700 dark:text-zinc-300">
                    {plugin.guide}
                  </p>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </main>
  );
};

export default CommandsDocs;
