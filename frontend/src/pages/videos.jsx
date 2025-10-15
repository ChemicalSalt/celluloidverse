import { useEffect, useState } from "react";

const Videos = () => {
  const [videos, setVideos] = useState([]);

  const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
  const CHANNEL_ID = "UC5hKgdP9UyPjIzn9ZkpKuCA";

  useEffect(() => {
    async function fetchVideos() {
      try {
        if (!API_KEY || API_KEY === "undefined") {
          console.error("Missing or invalid API key.");
          return;
        }

        const searchRes = await fetch(
          `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=25`
        );
        const searchData = await searchRes.json();

        const videoItems = (searchData.items || []).filter(
          (item) => item.id.kind === "youtube#video"
        );

        const videoIds = videoItems.map((item) => item.id.videoId).join(",");

        const detailsRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&id=${videoIds}&part=contentDetails,snippet`
        );
        const detailsData = await detailsRes.json();

        const parseDuration = (iso) => {
          const match = iso.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
          const minutes = parseInt(match?.[1] || "0");
          const seconds = parseInt(match?.[2] || "0");
          return minutes * 60 + seconds;
        };

        const regularVideos = (detailsData.items || []).filter((video) => {
          const duration = parseDuration(video.contentDetails.duration);
          return duration > 60;
        });

        setVideos(
          regularVideos.map((video) => ({
            id: video.id,
            title: video.snippet.title,
          }))
        );
      } catch (err) {
        console.error("Failed to fetch videos:", err);
      }
    }

    fetchVideos();
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-16 bg-gradient-to-b from-zinc-50 to-zinc-200 dark:from-black dark:to-zinc-900 text-black dark:text-white transition-all duration-300">
      
      {/* Header */}
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
         
          <span className="bg-gradient-to-r from-black to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
            Videos
          </span>
        </h1>
        <p className="text-gray-700 dark:text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
          Watch our latest in-depth content that blends creativity with technology — all in timeless black & white.
        </p>
      </section>

      {/* Video Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 w-full max-w-6xl">
        {videos.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 dark:text-gray-400">
            No videos to display yet.
          </div>
        ) : (
          videos.map((video) => (
            <div
              key={video.id}
              className="group relative bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
            >
              <div className="aspect-w-16 aspect-h-9">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${video.id}`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <h3 className="absolute bottom-3 left-4 right-4 text-sm md:text-base font-semibold text-white opacity-0 group-hover:opacity-100 transition-all duration-300">
                {video.title}
              </h3>
            </div>
          ))
        )}
      </section>
    </main>
  );
};

export default Videos;
