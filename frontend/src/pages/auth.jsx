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
      // Sanitize inputs before sending to Firebase
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
    <main className="bg-white text-black dark:bg-black dark:text-white min-h-screen flex flex-col justify-center items-center px-4 transition-colors duration-300">
      <h2 className="text-2xl font-bold mb-4">
        {user ? "Welcome" : isRegister ? "Register" : "Sign in"}
      </h2>

      {user ? (
        <div className="text-center space-y-4">
          <p className="text-lg">Logged in as:</p>
          <p className="text-yellow-500">{user.email}</p>
          <button
            onClick={handleLogout}
            className="mt-4 p-3 bg-white text-black dark:bg-white dark:text-black rounded hover:bg-gray-200 transition"
          >
            Logout
          </button>
        </div>
      ) : (
        <form onSubmit={handleAuth} className="space-y-4 w-full max-w-sm">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 rounded bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white placeholder-gray-400 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 rounded bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white placeholder-gray-400 focus:outline-none"
          />

          <button
            type="submit"
            className="w-full p-3 bg-black text-white dark:bg-white dark:text-black font-semibold rounded hover:bg-gray-800 dark:hover:bg-gray-200 transition"
          >
            {isRegister ? "Register" : "Sign in"}
          </button>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full p-3 bg-red-500 text-white font-semibold rounded hover:bg-red-600 transition"
          >
            Sign in with Google
          </button>

          <p className="text-center text-sm mt-2 text-gray-500 dark:text-gray-400">
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <span
              onClick={() => setIsRegister(!isRegister)}
              className="text-blue-500 cursor-pointer hover:underline"
            >
              {isRegister ? "Sign in" : "Register"}
            </span>
          </p>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </form>
      )}
    </main>
  );
};

export default Auth;
