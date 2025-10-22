import { useNavigate, useParams } from "react-router-dom";

const PluginsCategory = () => {
  const navigate = useNavigate();
  const { serverId } = useParams();

  const categories = [
    { title: "Moderation", description: "Manage server moderation tools.", path: "moderation" },
    { title: "Automation", description: "Automate welcome, farewell, language and scheduler.", path: "automation" },
    { title: "Utility", description: "Helpful tools like server info, role management and commands.", path: "utility" },
    { title: "Entertainment", description: "Fun features like games, memes and quizzes.", path: "entertainment" },
  ];

  return (
    <div className="min-h-screen px-6 py-12 bg-white dark:bg-black text-black dark:text-white">
      <h1 className="text-4xl font-bold mb-12 text-center tracking-tight">Plugin Categories</h1>
      <div className="grid gap-8 md:grid-cols-2">
        {categories.map((cat) => (
          <div
            key={cat.title}
            onClick={() => navigate(`/dashboard/${serverId}/plugins/overview?category=${cat.path}`)}
            className="p-8 bg-white/20 dark:bg-black/20 backdrop-blur-md border border-black/10 dark:border-white/20 rounded-2xl shadow-lg hover:scale-[1.03] hover:shadow-2xl cursor-pointer transition-all"
          >
            <h2 className="text-2xl font-semibold mb-2">{cat.title}</h2>
            <p className="opacity-70 text-sm leading-relaxed">{cat.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PluginsCategory;
