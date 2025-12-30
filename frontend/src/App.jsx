import './index.css';
import { Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/navbar';
import Footer from './components/footer';

import Home from './pages/Home';
import Dashboard from './pages/dashboard';
import GetStarted from './pages/GetStarted';
import BotStatus from './pages/BotStatus';
import Contact from './pages/contact';
import Content from './pages/content';
import About from './pages/about';
import Auth from './pages/auth';

/* Dashboard subpages */
import AddBot from "./pages/Dashboard/AddBot";
import PluginsOverview from "./pages/Dashboard/pluginsOverview";
import Welcome from "./pages/Dashboard/welcome";
import Farewell from "./pages/Dashboard/farewell";
import Language from "./pages/Dashboard/language";
import Scheduler from "./pages/Dashboard/scheduler"; 
import Automod from "./pages/Dashboard/autoMod";
import Mute from "./pages/Dashboard/mute";
import ReactionRoles from "./pages/Dashboard/reactionRoles";
import Polls from "./pages/Dashboard/polls";
import ServerInfo from "./pages/Dashboard/serverInfo";
import InviteTracker from "./pages/Dashboard/inviteTracker";
import Games from "./pages/Dashboard/games";
import Memes from "./pages/Dashboard/memes";
import Music from "./pages/Dashboard/music";
import CommandsDocs from "./pages/commandsDocs";
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
          <Route path="/content" element={<Content />} />

          <Route path="/about" element={<About />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/commands-docs" element={<CommandsDocs />} />


          {/* dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/addbot" element={<AddBot />} />
          <Route path="/dashboard/:serverId/plugins/overview" element={<PluginsOverview />} />
          <Route path="/dashboard/:serverId/plugins/welcome" element={<Welcome />} />
          <Route path="/dashboard/:serverId/plugins/farewell" element={<Farewell />} />
          <Route path="/dashboard/:serverId/plugins/language" element={<Language />} />
          <Route path="/dashboard/:serverId/plugins/scheduler" element={<Scheduler />} />
          <Route path="/dashboard/:serverId/plugins/automod" element={<Automod />} />
<Route path="/dashboard/:serverId/plugins/mute" element={<Mute />} />
<Route path="/dashboard/:serverId/plugins/reactionRoles" element={<ReactionRoles />} />
<Route path="/dashboard/:serverId/plugins/polls" element={<Polls />} />
<Route path="/dashboard/:serverId/plugins/serverInfo" element={<ServerInfo />} />
<Route path="/dashboard/:serverId/plugins/inviteTracker" element={<InviteTracker />} />
<Route path="/dashboard/:serverId/plugins/games" element={<Games />} />
<Route path="/dashboard/:serverId/plugins/memes" element={<Memes />} />
<Route path="/dashboard/:serverId/plugins/music" element={<Music />} />

          <Route path="/dashboard/:serverId/plugins/category" element={<PluginsCategory />} />
       

        </Routes>

        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default App;
