"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  audioUrl: string;
  duration?: number; // optional if you want later
};

export default function SharePlayer({ audioUrl }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showCTA, setShowCTA] = useState(false);

  const PREVIEW_LIMIT = 10; // seconds

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const update = () => {
      if (!audio.duration) return;

      const percent = (audio.currentTime / audio.duration) * 100;
      setProgress(percent);

      // 👇 CUT OFF LOGIC
      if (audio.currentTime >= PREVIEW_LIMIT) {
        audio.pause();
        setIsPlaying(false);
        setShowCTA(true);
      }
    };

    audio.addEventListener("timeupdate", update);
    return () => audio.removeEventListener("timeupdate", update);
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="w-full max-w-md mt-6">
      <audio ref={audioRef} src={audioUrl} />

      {/* Play Button */}
      <button
        onClick={togglePlay}
        className="w-full bg-emerald-500 text-black font-bold py-3 rounded-full"
      >
        {isPlaying ? "Pause" : "Play"}
      </button>

      {/* Progress */}
      <div className="mt-3 h-2 bg-gray-800 rounded">
        <div
          className="h-2 bg-emerald-400 rounded"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* CTA AFTER PREVIEW */}
      {showCTA && (
        <div className="mt-6 text-center">
          <h3 className="text-lg font-semibold text-white">
            Keep listening in Selfward
          </h3>
          <p className="text-gray-400 text-sm mt-2">
            Get the full experience and personalized audio.
          </p>

          <button className="mt-4 w-full bg-emerald-500 text-black font-bold py-3 rounded-full">
            Open in Selfward
          </button>
        </div>
      )}
    </div>
  );
}