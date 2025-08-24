import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Load reCAPTCHA script only on this page
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://www.google.com/recaptcha/api.js?render=6Lc1UWUrAAAAAN9u-CzXBFk8RYek-PsaP8ivJbwm";
    script.async = true;
    document.body.appendChild(script);
    document.body.classList.add("contact-page");

    return () => {
      document.body.removeChild(script);
      document.body.classList.remove("contact-page");
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    setError(null);

    try {
      const token = await window.grecaptcha.execute(
        "6Lc1UWUrAAAAAN9u-CzXBFk8RYek-PsaP8ivJbwm",
        { action: "submit" }
      );

      await addDoc(collection(db, "messages"), {
        name,
        email,
        message,
        recaptchaToken: token,
        timestamp: Timestamp.now(),
      });

      setSuccess(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      console.error("Firestore error:", err);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <main className="bg-white text-black dark:bg-black dark:text-white min-h-screen flex flex-col items-center px-4 transition-colors duration-300">
      {/* Welcome Section */}
      <section className="text-center mt-12">
        <h2 className="text-2xl font-bold mb-2">Welcome!</h2>
        <p className="text-gray-600 dark:text-gray-400">
Have questions or feedback? Reach out to the Celluloidverse team to connect about the bot or our latest videos.        </p>
      </section>

      {/* Contact Form */}
      <section className="w-full max-w-xl mt-12">
        <h3 className="text-xl font-semibold mb-4">Contact Us</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full p-3 rounded bg-zinc-400 dark:bg-zinc-800 text-black dark:text-white placeholder-gray-400 focus:outline-none"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 rounded bg-zinc-400 dark:bg-zinc-800 text-black dark:text-white placeholder-gray-400 focus:outline-none"
          />
          <textarea
            rows="4"
            placeholder="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            className="w-full p-3 rounded bg-zinc-400 dark:bg-zinc-800 text-black dark:text-white placeholder-gray-400 focus:outline-none"
          ></textarea>

          <button
            type="submit"
            className="w-full p-3 bg-black text-white dark:bg-white dark:text-black font-semibold rounded hover:bg-gray-900 dark:hover:bg-gray-200 transition"
          >
            Send
          </button>

          {/* Status Messages */}
          {success && <p className="text-green-500">Message sent successfully!</p>}
          {error && <p className="text-red-500">{error}</p>}

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            This site is protected by reCAPTCHA and the Google{" "}
            <a href="https://policies.google.com/privacy" className="underline">
              Privacy Policy
            </a>{" "}
            and{" "}
            <a href="https://policies.google.com/terms" className="underline">
              Terms of Service
            </a>{" "}
            apply.
          </p>
        </form>
      </section>
    </main>
  );
};

export default Contact;
