import './index.css';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/navbar';
import Footer from './components/footer';
import Home from './pages/Home';
import GetStarted from './pages/GetStarted';
import BotStatus from './pages/BotStatus';
import Contact from './pages/contact';
import Shorts from './pages/shorts';
import Videos from './pages/videos';
import About from './pages/about';
import Auth from './pages/auth';
import AddBot from "./pages/Dashboard/AddBot";
import PluginsOverview from "./pages/Dashboard/PluginsOverview";
import Welcome from "./pages/Dashboard/Welcome";
import Farewell from "./pages/Dashboard/Farewell";
import Language from "./pages/Dashboard/Language";
function App() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-black dark:bg-black dark:text-white transition-colors duration-300">
      <Navbar />
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
          <Route path="/dashboard" element={<AddBot />} />
          <Route path="/dashboard/addbot" element={<AddBot />} />
          <Route path="/dashboard/:serverId/plugins/overview" element={<PluginsOverview />} />
          <Route path="/dashboard/:serverId/plugins/welcome" element={<Welcome />} />
          <Route path="/dashboard/:serverId/plugins/farewell" element={<Farewell />} />
          <Route path="/dashboard/:serverId/plugins/language" element={<Language />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
