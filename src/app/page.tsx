"use client";

import { useState, useEffect, useRef } from "react";
import { Slider } from "@mui/material";

export default function Home() {
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
          initPlayer(id);
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
      initPlayer(id);
    } else {
      alert("Invalid YouTube URL");
    }
  };

  const initPlayer = (id: string) => {
    if (!(window as any).YT || !(window as any).YT.Player) {
      console.warn("YouTube API not loaded yet. Retrying...");
      setTimeout(() => initPlayer(id), 500);
      return;
    }

    if (playerRef.current) {
      playerRef.current.destroy();
    }

    playerRef.current = new (window as any).YT.Player("youtube-player", {
      height: "360",
      width: "640",
      videoId: id,
      playerVars: { start: startTime, end: endTime },
      events: {
        onReady: (event: any) => {
          setVideoDuration(event.target.getDuration());
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
    if (
      !playerRef.current ||
      typeof playerRef.current.getCurrentTime !== "function"
    ) {
      console.warn("Player is not ready yet.");
      return;
    }

    playerRef.current.seekTo(startTime);
    playerRef.current.playVideo();

    playerRef.current.addEventListener("onStateChange", (event: any) => {
      if (event.data === 1) {
        const checkLoop = setInterval(() => {
          if (playerRef.current.getCurrentTime() >= endTime) {
            playerRef.current.seekTo(startTime);
          }
        }, 500);
        playerRef.current.checkLoop = checkLoop;
      } else if (event.data === 2 && playerRef.current.checkLoop) {
        clearInterval(playerRef.current.checkLoop);
      }
    });
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
    </main>
  );
}
