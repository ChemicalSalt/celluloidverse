import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";

const PluginsOverview = () => {
  const { serverId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [server, setServer] = useState(null);

  useEffect(() => {
    if (!token || !serverId) return;

    const fetchServer = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/dashboard/servers/${serverId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setServer(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchServer();
  }, [token, serverId]);

  if (!server) return <div>Loading...</div>;

  return (
    <div className="min-h-screen px-6 py-8">
      <h1 className="text-3xl font-bold mb-6">Plugins Overview</h1>
      <div className="flex flex-col gap-4">
        <button
          className="px-4 py-2 bg-black text-white dark:bg-white text-black rounded"
          onClick={() => navigate(`/dashboard/${serverId}/plugins/welcome?token=${token}`)}
        >
          Configure Welcome Messages
        </button>
        <button
          className="px-4 py-2 bg-black text-white dark:bg-white text-black rounded"
          onClick={() => navigate(`/dashboard/${serverId}/plugins/farewell?token=${token}`)}
        >
          Configure Farewell Messages
        </button>
      </div>
    </div>
  );
};

export default PluginsOverview;
