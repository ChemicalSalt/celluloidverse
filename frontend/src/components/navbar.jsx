import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X, Moon, Sun } from "lucide-react";
import { FaYoutube, FaInstagram, FaDiscord } from "react-icons/fa";

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
    <header className="relative z-50 text-black dark:text-white">
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 py-4 px-5 sm:px-8">
        {/* Left: Hamburger Icon */}
        <button
          onClick={() => setMenuOpen(true)}
          className="text-black dark:text-white focus:outline-none transition-transform hover:scale-110"
        >
          <Menu size={28} />
        </button>

        {/* Center: Logo / Title */}
        <div className="flex-1 text-center px-4">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-wide">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-zinc-700 via-black to-zinc-700 dark:from-zinc-300 dark:via-white dark:to-zinc-300">
              CELLULOIDVERSE
            </span>
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm mt-1">
            Creativity is what makes us stand out.
          </p>
        </div>

        {/* Right: Sign In */}
        <Link
          to="/auth"
          className="text-black dark:text-white font-semibold text-sm sm:text-base hover:underline transition-colors"
        >
          Sign in
        </Link>
      </div>

      {/* Main Nav */}
      <nav className="py-4 bg-transparent">
        <div className="flex justify-center gap-6 sm:gap-10 text-base sm:text-lg font-medium px-4">
          {["Home", "Shorts", "Videos", "Contact", "About"].map((item) => (
            <Link
              key={item}
              to={item === "Home" ? "/" : `/${item.toLowerCase()}`}

              className="relative group"
            >
              {item}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-black dark:bg-white transition-all duration-300 group-hover:w-full"></span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Overlay when sidebar is open */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[9998] transition-opacity duration-300"
        ></div>
      )}

      {/* Sidebar Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-zinc-50 dark:bg-zinc-900 text-black dark:text-white z-[9999] shadow-xl transform ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out flex flex-col`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-xl font-bold">Menu</h2>
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle Theme"
              className="p-1 rounded-full transition-transform hover:scale-110"
            >
              {darkMode ? (
                <Moon size={23} className="text-white" />
              ) : (
                <Sun
                  size={23}
                  className="text-black hover:text-yellow-400 transition-colors"
                />
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={() => setMenuOpen(false)}
              className="text-black dark:text-white hover:scale-110 transition-transform"
            >
              <X size={26} />
            </button>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-col p-5 gap-5 text-lg font-medium mt-4">
          {["Home", "Shorts", "Videos", "Contact", "About"].map((item) => (
            <Link
              key={item}
              to={`/${item.toLowerCase()}`}
              onClick={() => setMenuOpen(false)}
              className="transition-all hover:translate-x-2 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              {item}
            </Link>
          ))}
        </div>

        {/* Socials */}
        <div className="flex flex-col items-center gap-6 p-4 border-t border-zinc-200 dark:border-zinc-700 mt-auto">
          <div className="flex gap-6">
            <a
              href="https://youtube.com/@celluloidverse"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaYoutube size={22} className="hover:text-red-500 transition-colors" />
            </a>
            <a
              href="https://discord.com/invite/kxmZsh9GUT"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaDiscord size={22} className="hover:text-indigo-500 transition-colors" />
            </a>
            <a
              href="https://instagram.com/celluloidverse"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaInstagram size={22} className="hover:text-pink-500 transition-colors" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
