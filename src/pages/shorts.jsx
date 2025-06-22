import { useEffect, useState } from "react";

const Shorts = () => {
  const [shorts, setShorts] = useState([]);

  const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
  const CHANNEL_ID = "UC5hKgdP9UyPjIzn9ZkpKuCA";

  useEffect(() => {
    async function fetchShorts() {
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
          item => item.id.kind === "youtube#video"
        );

        const videoIds = videoItems.map(item => item.id.videoId).join(",");

        const detailsRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&id=${videoIds}&part=contentDetails,snippet`
        );
        const detailsData = await detailsRes.json();

        const parseDuration = iso => {
          const match = iso.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
          const minutes = parseInt(match?.[1] || "0");
          const seconds = parseInt(match?.[2] || "0");
          return minutes * 60 + seconds;
        };

        const shortsOnly = (detailsData.items || []).filter(video => {
          const duration = parseDuration(video.contentDetails.duration);
          const title = video.snippet.title.toLowerCase();
          return duration <= 60 || title.includes("shorts");
        });

        setShorts(
          shortsOnly.map(video => ({
            id: video.id,
            title: video.snippet.title,
          }))
        );
      } catch (err) {
        console.error("Failed to fetch Shorts:", err);
      }
    }

    fetchShorts();
  }, []);

  return (
    <main className="bg-white text-black dark:bg-black dark:text-white min-h-screen flex flex-col items-center justify-center px-4 py-10 transition-colors duration-300">
      <section className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-4">AI Shorts</h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-xl">
          Discover quick, AI-crafted short content designed to entertain and inspire — in seconds.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        {shorts.map(video => (
          <div key={video.id} className="aspect-w-9 aspect-h-16">
            <iframe
              className="w-full h-full rounded-lg"
              src={`https://www.youtube.com/embed/${video.id}`}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        ))}
      </section>
    </main>
  );
};

export default Shorts;
