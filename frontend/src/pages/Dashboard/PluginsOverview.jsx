import { useParams, useNavigate } from "react-router-dom";

const PluginsOverview = () => {
  const { serverId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-6 py-8">
      <h1 className="text-3xl font-bold mb-6">Plugin Overview</h1>
      <p className="mb-4">Server ID: {serverId}</p>

      <div className="flex flex-col gap-4">
        <div className="p-4 bg-zinc-200 rounded shadow flex justify-between items-center">
          <span>Welcome Plugin</span>
          <button
            onClick={() => navigate(`/dashboard/${serverId}/plugins/welcome`)}
            className="px-4 py-1 bg-purple-600 text-white rounded"
          >
            Configure
          </button>
        </div>

        <div className="p-4 bg-zinc-200 rounded shadow flex justify-between items-center">
          <span>Farewell Plugin</span>
          <button
            onClick={() => navigate(`/dashboard/${serverId}/plugins/farewell`)}
            className="px-4 py-1 bg-purple-600 text-white rounded"
          >
            Configure
          </button>
        </div>
      </div>
    </div>
  );
};

export default PluginsOverview;
