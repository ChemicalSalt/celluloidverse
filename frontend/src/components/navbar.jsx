import { Link, useLocation } from "react-router-dom";
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

  const location = useLocation();
 const navItems = ["Home", "Dashboard", "Content", "Contact", "About"];


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
      <div
        className={`flex items-center justify-between py-3 px-4 sm:py-5 sm:px-8 transition-colors duration-300 border-t ${
          darkMode ? "bg-black border-zinc-800" : "bg-white border-zinc-300"
        }`}
      >
        {/* Left: Hamburger (mobile) */}
        <button
          onClick={() => setMenuOpen(true)}
          className="text-black dark:text-white focus:outline-none transition-transform hover:scale-105 sm:hidden"
        >
          <Menu size={24} />
        </button>

        {/* Center: Logo */}
        <div className="flex-1 text-center px-2">
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-wide">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-zinc-700 via-black to-zinc-700 dark:from-zinc-300 dark:via-white dark:to-zinc-300">
              CELLULOIDVERSE
            </span>
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-[10px] sm:text-sm mt-1">
            Creativity is what makes us stand out.
          </p>
        </div>

        {/* Right: Sign In */}
        <Link
          to="/auth"
          className="text-black dark:text-white font-semibold text-xs sm:text-sm hover:underline transition-colors"
        >
          Sign in
        </Link>
      </div>

      {/* Nav Items */}
      <nav
        className={`py-2 sm:py-4 transition-colors duration-300 border-b ${
          darkMode ? "bg-black border-zinc-800" : "bg-white border-zinc-300"
        }`}
      >
        <div className="flex justify-center gap-4 sm:gap-12 text-sm sm:text-lg font-medium px-2 sm:px-4">
          {navItems.map((item) => {
            const isActive =
              location.pathname === "/" && item === "Home"
                ? true
                : location.pathname.includes(item.toLowerCase());
            return (
              <Link
                key={item}
                to={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                className={`relative group transition-colors duration-300 ${
                  isActive
                    ? "text-zinc-900 dark:text-zinc-100 font-semibold"
                    : "text-zinc-800 dark:text-zinc-200"
                }`}
              >
                {item}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-zinc-800 dark:bg-zinc-200 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Overlay */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[9998] transition-opacity duration-300"
        ></div>
      )}

      {/* Sidebar (mobile) */}
      <div
        className={`fixed top-0 left-0 h-full w-64 z-[9999] shadow-xl transform ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out flex flex-col sm:hidden ${
          darkMode ? "bg-black text-white" : "bg-white text-black"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex justify-between items-center p-4 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-lg font-bold">Menu</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle Theme"
              className="p-1 rounded-full transition-transform hover:scale-110"
            >
              {darkMode ? (
                <Moon size={20} className="text-white" />
              ) : (
                <Sun
                  size={20}
                  className="text-black hover:text-yellow-400 transition-colors"
                />
              )}
            </button>
            <button
              onClick={() => setMenuOpen(false)}
              className="text-black dark:text-white hover:scale-110 transition-transform"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Sidebar Links */}
        <div className="flex flex-col p-4 gap-4 text-base font-medium mt-4">
          {navItems.map((item) => (
            <Link
              key={item}
              to={item === "Home" ? "/" : `/${item.toLowerCase()}`}
              onClick={() => setMenuOpen(false)}
              className="transition-all hover:translate-x-2 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              {item}
            </Link>
          ))}
          {/* Sign in in mobile menu */}
          <Link
            to="/auth"
            onClick={() => setMenuOpen(false)}
            className="font-semibold mt-4 text-zinc-900 dark:text-zinc-100 hover:underline"
          >
            Sign in
          </Link>
        </div>

        {/* Socials */}
        <div className="flex flex-col items-center gap-4 p-4 border-t border-zinc-200 dark:border-zinc-700 mt-auto">
          <div className="flex gap-4">
            <a
              href="https://youtube.com/@celluloidverse"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform hover:scale-105"
            >
              <FaYoutube
                className={`w-6 h-6 transition-colors duration-300 ${
                  darkMode
                    ? "text-white/80 hover:text-red-500"
                    : "text-black/80 hover:text-red-600"
                }`}
              />
            </a>
            <a
              href="https://discord.com/invite/kxmZsh9GUT"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform hover:scale-105"
            >
              <FaDiscord
                className={`w-6 h-6 transition-colors duration-300 ${
                  darkMode
                    ? "text-white/80 hover:text-indigo-400"
                    : "text-black/80 hover:text-indigo-600"
                }`}
              />
            </a>
            <a
              href="https://instagram.com/celluloidverse"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform hover:scale-105"
            >
              <FaInstagram
                className={`w-6 h-6 transition-colors duration-300 ${
                  darkMode
                    ? "text-white/80 hover:text-pink-400"
                    : "text-black/80 hover:text-pink-600"
                }`}
              />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
