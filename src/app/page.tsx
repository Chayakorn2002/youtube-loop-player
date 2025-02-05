"use client";

import { useState, useEffect, useRef } from "react";
import { Slider } from "@mui/material";

export default function Home() {
  const favorites = [
    {
      title: "Maroon 5 - Sunday Morning (Bossa Cover)",
      url: "https://www.youtube.com/watch?v=Zvul7tj3EkE",
      startTime: 148,
      endTime: 161,
    },
    {
      title: "【ピアノ演奏】King Gnu「一途」を弾いてみた",
      url: "https://youtu.be/cKDd44yzIQY?si=TC0e9IKmhc7bkU8K",
      startTime: 206,
      endTime: 240,
    },
  ];

  const [videoId, setVideoId] = useState<string>("");
  const [inputUrl, setInputUrl] = useState<string>("");
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    loadYouTubeAPI(() => {
      const savedUrl = localStorage.getItem("youtubeUrl") || "";
      const savedStart = Number(localStorage.getItem("startTime")) || 0;
      const savedEnd = Number(localStorage.getItem("endTime")) || 0;

      setInputUrl(savedUrl);
      setStartTime(savedStart);
      setEndTime(savedEnd);

      if (savedUrl) {
        const id = extractVideoId(savedUrl);
        if (id) {
          setVideoId(id);
          initPlayer(id, savedStart, savedEnd);
        }
      }
    });
  }, []);

  const loadYouTubeAPI = (callback?: () => void) => {
    if ((window as any).YT && (window as any).YT.Player) {
      callback?.();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.body.appendChild(script);

    (window as any).onYouTubeIframeAPIReady = () => {
      console.log("YouTube API Loaded");
      callback?.();
    };
  };

  const extractVideoId = (url: string) => {
    const match = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
    );
    return match ? match[1] : null;
  };

  const handleLoadVideo = () => {
    if (!inputUrl) return;
    localStorage.setItem("youtubeUrl", inputUrl);

    const id = extractVideoId(inputUrl);
    if (id) {
      setVideoId(id);
      initPlayer(id, startTime, endTime);
    } else {
      alert("Invalid YouTube URL");
    }
  };

  const initPlayer = (id: string, start: number, end: number) => {
    if (!(window as any).YT || !(window as any).YT.Player) {
      console.warn("YouTube API not loaded yet. Retrying...");
      setTimeout(() => initPlayer(id, start, end), 5000);
      return;
    }

    if (playerRef.current) {
      playerRef.current.destroy();
    }

    playerRef.current = new (window as any).YT.Player("youtube-player", {
      height: "360",
      width: "640",
      videoId: id,
      playerVars: { start, end, autoplay: 1 },
      events: {
        onReady: (event: any) => {
          setVideoDuration(event.target.getDuration());
          playerRef.current = event.target;
        },
        onStateChange: (event: any) => {
          if (event.data === 0) {
            event.target.seekTo(startTime);
            event.target.playVideo();
          }
        },
      },
    });
  };

  const handleSliderChange = (_: Event, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      setStartTime(newValue[0]);
      setEndTime(newValue[1]);

      localStorage.setItem("startTime", String(newValue[0]));
      localStorage.setItem("endTime", String(newValue[1]));
    }
  };

  const startLoop = () => {
    const player = playerRef.current;

    if (!player || typeof player.getCurrentTime !== "function") {
      console.warn("Player is not ready yet.");
      return;
    }

    player.seekTo(startTime, true);

    const checkSeek = setInterval(() => {
      if (Math.abs(player.getCurrentTime() - startTime) < 0.5) {
        clearInterval(checkSeek);
        player.playVideo();
        console.log("Current Time after seek:", player.getCurrentTime());

        const checkLoop = setInterval(() => {
          if (player.getCurrentTime() >= endTime) {
            player.seekTo(startTime, true);
          }
        }, 250);

        player.addEventListener("onStateChange", (event: any) => {
          if (event.data !== 1) {
            clearInterval(checkLoop);
          }
        });
      }
    }, 100);
  };

  const handleFavoriteSelect = (fav: {
    title: string;
    url: string;
    startTime: number;
    endTime: number;
  }) => {
    setInputUrl(fav.url);
    setStartTime(fav.startTime);
    setEndTime(fav.endTime);
    localStorage.setItem("youtubeUrl", fav.url);
    localStorage.setItem("startTime", String(fav.startTime));
    localStorage.setItem("endTime", String(fav.endTime));

    const id = extractVideoId(fav.url);
    if (id) {
      setVideoId(id);
      initPlayer(id, fav.startTime, fav.endTime);
    }
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-[#ff9a9e] via-[#fad0c4] to-[#fad0c4] overflow-hidden">
      <h1 className="text-4xl font-extrabold text-white drop-shadow-lg mb-5 font-[Poppins]">
        ✨ YouTube Loop Player ✨
      </h1>

      <div className="bg-white/90 p-5 rounded-2xl shadow-lg w-full max-w-lg text-center backdrop-blur-lg">
        <input
          type="text"
          placeholder="🔗 Paste YouTube URL here!"
          className="border border-pink-400 p-3 rounded-lg w-full mb-3 text-gray-700 focus:ring-4 focus:ring-pink-500 focus:outline-none transition-shadow"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
        />
        <button
          className="bg-pink-600 text-white px-4 py-2 rounded-lg w-full font-medium shadow-lg hover:bg-pink-700 transition-all hover:shadow-pink-500/50"
          onClick={handleLoadVideo}
        >
          Load Video
        </button>
      </div>

      <div
        id="youtube-player"
        className="mt-6 rounded-xl overflow-hidden shadow-lg"
      ></div>

      {videoDuration > 0 && (
        <div className="bg-white/90 p-5 rounded-2xl shadow-lg w-full max-w-lg mt-5 text-center backdrop-blur-lg">
          <p className="text-sm text-gray-600 mb-2">
            🎶 Loop:{" "}
            <span className="font-semibold text-pink-500">
              {formatTime(startTime)}
            </span>{" "}
            -{" "}
            <span className="font-semibold text-pink-500">
              {formatTime(endTime)}
            </span>
          </p>
          <Slider
            value={[startTime, endTime]}
            min={0}
            max={videoDuration}
            step={1}
            onChange={handleSliderChange}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => formatTime(value as number)}
            sx={{
              color: "#ec4899",
              "& .MuiSlider-thumb": {
                width: 20,
                height: 20,
                backgroundColor: "#f472b6",
              },
              "& .MuiSlider-track": { backgroundColor: "#ec4899" },
              "& .MuiSlider-rail": { backgroundColor: "#fbcfe8" },
            }}
          />
          <button
            className="bg-green-400 text-white px-4 py-2 rounded-lg w-full font-medium shadow-lg mt-4 hover:bg-green-500 transition-all"
            onClick={startLoop}
          >
            ▶️ Start Loop
          </button>
        </div>
      )}
      <div className="bg-white/90 p-5 rounded-2xl shadow-lg w-full max-w-lg text-center backdrop-blur-lg mt-5">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          🎧 Try Tan's Favorite
        </h2>
        <ul className="space-y-2">
          {favorites.map((fav, index) => (
            <li
              key={index}
              className="cursor-pointer p-3 rounded-lg bg-pink-100 hover:bg-pink-200 transition-all text-pink-700 font-medium shadow-md"
              onClick={() => handleFavoriteSelect(fav)}
            >
              {fav.title} <br />
              <span className="text-sm text-gray-600">
                {formatTime(fav.startTime)} - {formatTime(fav.endTime)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
