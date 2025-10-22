import { useEffect, useState } from "react";

const Content = () => {
  const [shorts, setShorts] = useState([]);
  const [videos, setVideos] = useState([]);

  const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
  const CHANNEL_ID = "UC5hKgdP9UyPjIzn9ZkpKuCA";

  useEffect(() => {
    async function fetchContent() {
      try {
        if (!API_KEY || API_KEY === "undefined") {
          console.error("Missing or invalid API key.");
          return;
        }

        const searchRes = await fetch(
          `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=50`
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

        const shortsOnly = [];
        const regularVideos = [];

        (detailsData.items || []).forEach((video) => {
          const duration = parseDuration(video.contentDetails.duration);
          const data = {
            id: video.id,
            title: video.snippet.title,
            thumbnail: video.snippet.thumbnails.medium.url,
          };
          if (duration <= 60) shortsOnly.push(data);
          else regularVideos.push(data);
        });

        setShorts(shortsOnly);
        setVideos(regularVideos);
      } catch (err) {
        console.error("Failed to fetch YouTube data:", err);
      }
    }

    fetchContent();
  }, []);

  return (
    <main
      className="min-h-screen w-full flex flex-col items-center justify-start px-6 py-20 
      bg-[linear-gradient(180deg,_#f4f4f5_0%,_#e4e4e7_25%,_#d4d4d8_50%,_#e4e4e7_75%,_#f4f4f5_100%)]
      dark:bg-[linear-gradient(180deg,_#000_0%,_#111_25%,_#1c1c1c_50%,_#111_75%,_#000_100%)]
      text-black dark:text-zinc-100 transition-colors duration-700"
    >
      {/* Shorts Section */}
      <section className="w-full max-w-7xl mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight text-center">
          <span className="bg-gradient-to-r from-black to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
            Shorts
          </span>
        </h1>

        {shorts.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No Shorts available yet.
          </p>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-400 dark:scrollbar-thumb-zinc-700">
            {shorts.map((short) => (
              <div
                key={short.id}
                className="flex-shrink-0 w-48 sm:w-56 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:scale-[1.03] transition-all duration-300"
              >
                <div className="aspect-[9/16]">
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${short.id}`}
                    title={short.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
                <p className="text-sm font-semibold p-2 text-center line-clamp-2">
                  {short.title}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Videos Section */}
      <section className="w-full max-w-7xl">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight text-center">
          <span className="bg-gradient-to-r from-black to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
            Videos
          </span>
        </h1>

        {videos.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No videos available yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {videos.map((video) => (
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
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Content;
