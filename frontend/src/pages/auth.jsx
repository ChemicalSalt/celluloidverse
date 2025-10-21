import { useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { sanitizeDynamic } from "../utils/sanitize";
import { motion } from "framer-motion";

const Auth = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const safeEmail = sanitizeDynamic(email, { maxLen: 100 });
      const safePassword = sanitizeDynamic(password, { maxLen: 100 });

      if (isRegister) {
        await createUserWithEmailAndPassword(auth, safeEmail, safePassword);
      } else {
        await signInWithEmailAndPassword(auth, safeEmail, safePassword);
      }

      setEmail("");
      setPassword("");
      navigate("/videos");
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate("/videos");
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message);
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-200 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 transition-colors duration-500">
      <motion.div
        key={isRegister}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md p-8 rounded-3xl backdrop-blur-xl bg-white/60 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-700 shadow-xl flex flex-col gap-6 transition-all duration-500"
      >
        <h2 className="text-2xl font-extrabold text-center text-zinc-900 dark:text-zinc-100">
          {user ? "Welcome" : isRegister ? "Register" : "Sign in"}
        </h2>

        {user ? (
          <div className="text-center space-y-4">
            <p className="text-lg text-zinc-700 dark:text-zinc-300">Logged in as:</p>
            <p className="text-yellow-500 font-mono">{user.email}</p>
            <button
              onClick={handleLogout}
              className="mt-4 px-6 py-2 rounded-full bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-400 text-white dark:text-black font-semibold shadow hover:opacity-90 transition"
            >
              Logout
            </button>
          </div>
        ) : (
          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:ring-2 focus:ring-zinc-500 outline-none transition"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:ring-2 focus:ring-zinc-500 outline-none transition"
            />

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-400 text-white dark:text-black font-semibold shadow-lg hover:scale-[1.03] transition-transform"
            >
              {isRegister ? "Register" : "Sign in"}
            </button>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-3 rounded-full bg-red-600 text-white font-semibold shadow hover:bg-red-700 transition"
            >
              Sign in with Google
            </button>

            <p className="text-center text-sm mt-2 text-zinc-600 dark:text-zinc-400">
              {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
              <span
                onClick={() => setIsRegister(!isRegister)}
                className="text-blue-500 cursor-pointer hover:underline"
              >
                {isRegister ? "Sign in" : "Register"}
              </span>
            </p>

            {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
          </form>
        )}
      </motion.div>
    </main>
  );
};

export default Auth;
