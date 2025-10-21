import './index.css';
import { Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/navbar';
import Footer from './components/footer';

import Home from './pages/Home';
import Dashboard from './pages/dashboard';
import GetStarted from './pages/GetStarted';
import BotStatus from './pages/BotStatus';
import Contact from './pages/contact';
import Shorts from './pages/shorts';
import Videos from './pages/videos';
import About from './pages/about';
import Auth from './pages/auth';

/* Dashboard subpages */
import AddBot from "./pages/Dashboard/AddBot";
import PluginsOverview from "./pages/Dashboard/pluginsOverview";
import Welcome from "./pages/Dashboard/welcome";
import Farewell from "./pages/Dashboard/farewell";
import Language from "./pages/Dashboard/language";
import PluginsCategory from "./pages/Dashboard/pluginsCategory";
function App() {
  return (
    /* GLOBAL BACKGROUND HANDLED VIA index.css */
    <div className="min-h-screen flex flex-col text-white">
      <Navbar />

      {/* main content */}
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

          {/* dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/addbot" element={<AddBot />} />
          <Route path="/dashboard/:serverId/plugins/overview" element={<PluginsOverview />} />
          <Route path="/dashboard/:serverId/plugins/welcome" element={<Welcome />} />
          <Route path="/dashboard/:serverId/plugins/farewell" element={<Farewell />} />
          <Route path="/dashboard/:serverId/plugins/language" element={<Language />} />
          <Route path="/dashboard/:serverId/plugins/category" element={<PluginsCategory />} />
        </Routes>

        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default App;
