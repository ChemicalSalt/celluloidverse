import './index.css';
import { Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import Dashboard from './pages/dashboard';
import GetStarted from './pages/GetStarted';
import BotStatus from './pages/BotStatus';
import Contact from './pages/contact';
import Shorts from './pages/shorts';
import Videos from './pages/videos';
import About from './pages/About';
import Auth from './pages/Auth';

/* Dashboard subpages (keep paths you already have) */
import AddBot from "./pages/Dashboard/AddBot";
import PluginsOverview from "./pages/Dashboard/PluginsOverview";
import Welcome from "./pages/Dashboard/Welcome";
import Farewell from "./pages/Dashboard/farewell";
import Language from "./pages/Dashboard/Language";

function App() {
  return (
    /* SINGLE SOURCE OF TRUTH: global gradient background here */
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-950 text-white">
      <Navbar />

      {/* main area stretches to fill and pages are transparent */}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/getstarted" element={<GetStarted />} />
          <Route path="/botstatus" element={<BotStatus />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/shorts" element={<Shorts />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/about" element={<About />} />
          <Route path="/auth" element={<Auth />} />

          {/* dashboard routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/addbot" element={<AddBot />} />
          <Route path="/dashboard/:serverId/plugins/overview" element={<PluginsOverview />} />
          <Route path="/dashboard/:serverId/plugins/welcome" element={<Welcome />} />
          <Route path="/dashboard/:serverId/plugins/farewell" element={<Farewell />} />
          <Route path="/dashboard/:serverId/plugins/language" element={<Language />} />
        </Routes>

        {/* in case nested routes or Outlet needed later */}
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default App;
