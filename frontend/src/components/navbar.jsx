import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Menu, X, Moon, Sun } from 'lucide-react';
import { FaYoutube, FaInstagram, FaDiscord } from 'react-icons/fa';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("theme") === "dark" ||
        (!localStorage.getItem("theme") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
      );
    }
    return true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <header className="relative z-50 text-black dark:text-white overflow-x-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-black py-4 px-4 sm:px-6">
        {/* Hamburger Icon */}
        <button
          onClick={() => setMenuOpen(true)}
          className="text-black dark:text-white focus:outline-none"
        >
          <Menu size={28} />
        </button>

        {/* Centered Title */}
        <div className="flex-1 text-center px-4">
          <h1 className="text-2xl sm:text-5xl font-extrabold tracking-wide">
            CELLULOIDVERSE
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-base mt-1">
            Creativity is what makes us stand out.
          </p>
        </div>

        {/* Sign In Button */}
        <Link
          to="/auth"
          className="text-black dark:text-white px-3 py-1 font-semibold text-sm"
        >
          Sign in
        </Link>
      </div>

      {/* Separator */}
      <hr className="border-t border-black/10 dark:border-white/10" />

      {/* Main Nav */}
      <nav className="py-4 bg-transparent">
        <div className="flex justify-center gap-6 sm:gap-8 text-base sm:text-lg font-medium px-4">
          <Link to="/">Home</Link>
          <Link to="/shorts">Shorts</Link>
          <Link to="/videos">Videos</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/about">About</Link>
        </div>
      </nav>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-black text-black dark:text-white z-50 shadow-lg transform ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out flex flex-col`}
      >
        {/* Menu Header */}
        <div className="flex justify-between items-center p-4 border-b border-black/10 dark:border-white/10">
          <h2 className="text-xl font-bold">Menu</h2>
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle Theme"
              className="p-1 rounded-full transition-colors duration-300"
            >
              {darkMode ? (
                <Moon size={23} className="text-white" />
              ) : (
                <Sun size={23} className="text-black hover:text-yellow-400 transition-colors" />
              )}
            </button>

            <button
              onClick={() => setMenuOpen(false)}
              className="text-black dark:text-white transition-colors"
            >
              <X size={28} />
            </button>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-col p-4 gap-4 text-lg font-medium mt-6">
          <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/shorts" onClick={() => setMenuOpen(false)}>Shorts</Link>
          <Link to="/videos" onClick={() => setMenuOpen(false)}>Videos</Link>
          <Link to="/contact" onClick={() => setMenuOpen(false)}>Contact</Link>
          <Link to="/about" onClick={() => setMenuOpen(false)}>About</Link>
        </div>

        {/* Social Links */}
        <div className="flex flex-col items-center gap-6 p-4 border-t border-black/10 dark:border-white/10 mt-auto">
          <div className="flex gap-6">
            <a href="https://youtube.com/@celluloidverse" target="_blank" rel="noopener noreferrer">
              <FaYoutube size={22} className="hover:text-red-500 transition-colors" />
            </a>
            <a href="https://discord.com/invite/kxmZsh9GUT" target="_blank" rel="noopener noreferrer">
              <FaDiscord size={22} className="hover:text-indigo-500 transition-colors" />
            </a>
            <a href="https://instagram.com/celluloidverse" target="_blank" rel="noopener noreferrer">
              <FaInstagram size={22} className="hover:text-pink-500 transition-colors" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
