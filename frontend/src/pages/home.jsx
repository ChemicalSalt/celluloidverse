const Home = () => {
  return (
    <main
      className="min-h-screen w-full flex flex-col items-center justify-center overflow-x-hidden transition-colors duration-700
      bg-gradient-to-b from-zinc-100 via-zinc-50 to-zinc-100 text-zinc-900
      dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 dark:text-zinc-100"
    >
      <section className="flex flex-col items-center justify-center text-center px-6 py-24 space-y-16 w-full max-w-4xl">
        {/* Title */}
        <div>
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 tracking-tight">
            Welcome to{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-800 dark:from-zinc-300 dark:via-zinc-100 dark:to-zinc-300">
              Celluloidverse
            </span>
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed max-w-2xl mx-auto mb-10">
            Your all-in-one dashboard for creators and communities — manage your Discord bot,
            track YouTube updates, and connect everything in one smooth space.
          </p>

          <FancyButton
            text="Get Started"
            onClick={() => (window.location.href = "/getstarted")}
          />
        </div>
      </section>
    </main>
  );
};

/* Fancy button (same style for consistency) */
const FancyButton = ({ text, onClick }) => (
  <button
    onClick={onClick}
    className="relative px-10 py-4 rounded-full font-semibold tracking-wide overflow-hidden
      transition-all duration-300 group
      bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900
      hover:scale-105 hover:shadow-[0_0_25px_rgba(255,255,255,0.1)] dark:hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
  >
    <span className="relative z-10">{text}</span>
    <span
      className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 blur-xl
      bg-gradient-to-r from-zinc-400 via-zinc-200 to-zinc-500 
      dark:from-zinc-700 dark:via-zinc-400 dark:to-zinc-700
      transition-all duration-500"
    ></span>
  </button>
);

export default Home;
