import { FaYoutube, FaInstagram, FaDiscord } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="w-full text-gray-800 dark:text-white/80 border-t border-gray-200 dark:border-white/10 py-8 px-6 mt-auto bg-white dark:bg-black">
      <div className="flex flex-col items-center justify-center space-y-5 text-center">
        {/* Social Icons */}
        <div className="flex gap-6">
          <a
            href="https://youtube.com/@celluloidverse"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-transform hover:scale-110"
          >
            <FaYoutube className="w-7 h-7 text-gray-800 dark:text-white/80 hover:text-red-500 transition-colors duration-300" />
          </a>
          <a
            href="https://discord.com/invite/kxmZsh9GUT"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-transform hover:scale-110"
          >
            <FaDiscord className="w-7 h-7 text-gray-800 dark:text-white/80 hover:text-indigo-500 transition-colors duration-300" />
          </a>
          <a
            href="https://instagram.com/celluloidverse"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-transform hover:scale-110"
          >
            <FaInstagram className="w-7 h-7 text-gray-800 dark:text-white/80 hover:text-pink-500 transition-colors duration-300" />
          </a>
        </div>

        {/* Copyright */}
        <p className="text-sm text-gray-500 dark:text-white/60">
          &copy; 2025 Celluloidverse. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
