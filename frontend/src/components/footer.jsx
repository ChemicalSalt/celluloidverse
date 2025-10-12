import { FaYoutube, FaInstagram, FaDiscord } from "react-icons/fa";

const Footer = () => {
  return (
    <footer
      className="w-full bg-transparent text-black dark:text-white 
                 px-6 py-8 mt-auto border-t border-zinc-300 
                 dark:border-zinc-700 transition-all duration-300"
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        {/* Social media icons */}
        <div className="flex gap-5">
          <a
            href="https://youtube.com/@celluloidverse"
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline"
          >
            <FaYoutube className="w-7 h-7 text-zinc-800 dark:text-zinc-100 hover:text-red-500 transition-colors duration-300" />
          </a>
          <a
            href="https://discord.com/invite/kxmZsh9GUT"
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline"
          >
            <FaDiscord className="w-7 h-7 text-zinc-800 dark:text-zinc-100 hover:text-indigo-500 transition-colors duration-300" />
          </a>
          <a
            href="https://instagram.com/celluloidverse"
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline"
          >
            <FaInstagram className="w-7 h-7 text-zinc-800 dark:text-zinc-100 hover:text-pink-500 transition-colors duration-300" />
          </a>
        </div>

        {/* Copyright */}
        <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
          &copy; 2025 Celluloidverse. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
