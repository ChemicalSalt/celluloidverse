import './index.css';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/navbar';
import Footer from './components/footer';
import Home from './pages/home';
import GetStarted from './pages/getStarted';
import BotStatus from './pages/botStatus';
import Contact from './pages/contact';
import Shorts from './pages/shorts';
import Videos from './pages/videos';
import About from './pages/about';
import Auth from './pages/auth';

import Dashboard from './pages/dashboard';
function App() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-black dark:bg-black dark:text-white transition-colors duration-300">
      {/* Navbar */}
      <Navbar />

      {/* Page Routes */}
      <main className="flex-grow px-6 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/getstarted" element={<GetStarted />} />
          <Route path="/botstatus" element={<BotStatus />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/shorts" element={<Shorts />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/about" element={<About />} />
          <Route path="/auth" element={<Auth />} />
         <Route path="/servers" element={<Dashboard />} />

          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
