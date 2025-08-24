import { FaYoutube, FaInstagram, FaDiscord } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-white text-black dark:bg-black dark:text-white px-6 py-6 mt-auto border-t border-black/10 dark:border-white/20 transition-colors duration-300">
      <div className="flex flex-col items-center justify-center space-y-4">
        {/* Social media icons - Centered */}
        <div className="flex gap-4">
          <a href="https://youtube.com/@celluloidverse" target="_blank" rel="noopener noreferrer" className="no-underline">
            <FaYoutube className="w-7 h-7 text-black dark:text-white hover:text-red-500 transition-colors" />
          </a>
          <a href="https://discord.com/invite/kxmZsh9GUT" target="_blank" rel="noopener noreferrer" className="no-underline">
            <FaDiscord className="w-7 h-7 text-black dark:text-white hover:text-indigo-500 transition-colors" />
          </a>
          <a href="https://instagram.com/celluloidverse" target="_blank" rel="noopener noreferrer" className="no-underline">
            <FaInstagram className="w-7 h-7 text-black dark:text-white hover:text-pink-500 transition-colors" />
          </a>
        </div>

        {/* Copyright */}
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          &copy; 2025 Celluloidverse. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
