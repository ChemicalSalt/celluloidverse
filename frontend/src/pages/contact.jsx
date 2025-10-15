import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { sanitizeDynamic } from "../utils/sanitize";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

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
      const sanitizedName = sanitizeDynamic(name);
      const sanitizedEmail = sanitizeDynamic(email);
      const sanitizedMessage = sanitizeDynamic(message, { maxLen: 1000 });

      const token = window.grecaptcha
        ? await window.grecaptcha.execute(
            "6Lc1UWUrAAAAAN9u-CzXBFk8RYek-PsaP8ivJbwm",
            { action: "submit" }
          )
        : null;

      await addDoc(collection(db, "messages"), {
        name: sanitizedName,
        email: sanitizedEmail,
        message: sanitizedMessage,
        recaptchaToken: token || "",
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
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-200 dark:from-black dark:to-zinc-900 text-black dark:text-white flex flex-col items-center justify-center px-6 py-20 transition-colors duration-300 font-sans">
      {/* Header */}
      <section className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">
          Contact <span className="bg-gradient-to-r from-black to-zinc-500 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">Us</span>
        </h2>
        <p className="text-gray-700 dark:text-gray-400 text-base md:text-lg max-w-xl mx-auto">
          Have any questions or feedback? Let’s stay connected.
        </p>
      </section>

      {/* Contact Form */}
      <section className="w-full max-w-xl bg-zinc-100 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-xl backdrop-blur-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-800 dark:text-gray-300 uppercase tracking-wide">
              Name
            </label>
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full p-3 rounded-lg bg-zinc-200 dark:bg-zinc-900 text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-700 transition-all duration-200"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-800 dark:text-gray-300 uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 rounded-lg bg-zinc-200 dark:bg-zinc-900 text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-700 transition-all duration-200"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-800 dark:text-gray-300 uppercase tracking-wide">
              Message
            </label>
            <textarea
              rows="5"
              placeholder="Write your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              className="w-full p-3 rounded-lg bg-zinc-200 dark:bg-zinc-900 text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-700 resize-none transition-all duration-200"
            ></textarea>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 font-semibold rounded-lg bg-black text-white dark:bg-white dark:text-black shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
          >
            Send Message
          </button>

          {/* Status */}
          {success && (
            <p className="text-center text-green-500 mt-3">
              ✅ Message sent successfully!
            </p>
          )}
          {error && (
            <p className="text-center text-red-500 mt-3">
              ❌ {error}
            </p>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-4">
            Protected by Google reCAPTCHA —{" "}
            <a
              href="https://policies.google.com/privacy"
              className="underline hover:text-gray-700 dark:hover:text-gray-300"
            >
              Privacy Policy
            </a>{" "}
            and{" "}
            <a
              href="https://policies.google.com/terms"
              className="underline hover:text-gray-700 dark:hover:text-gray-300"
            >
              Terms of Service
            </a>
            .
          </p>
        </form>
      </section>
    </main>
  );
};

export default Contact;
