"use client";

import { useRef, useState } from "react";

type Props = {
  audioUrl: string;
};

export default function SharePlayer({ audioUrl }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showCTA, setShowCTA] = useState(false);

  // ⬇️ CHANGE THIS VALUE LATER IF NEEDED
const PREVIEW_LIMIT = 8;
const SHORT_AUDIO_THRESHOLD = 10;

  const handlePlayPause = () => {
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

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const duration = audio.duration || 1;

    // progress bar (0 → 1)
    setProgress(audio.currentTime / duration);

    // stop preview early
if (
  audio.duration > SHORT_AUDIO_THRESHOLD &&
  audio.currentTime >= PREVIEW_LIMIT
) {      audio.pause();
      setIsPlaying(false);
      setShowCTA(true);
    }
  };

  return (
    <div className="mt-6 w-full max-w-md">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
      />

      <button
        onClick={handlePlayPause}
        className="w-full rounded-full bg-green-500 py-4 text-black font-semibold text-lg"
      >
        {isPlaying ? "Pause" : "Play"}
      </button>

      <div className="mt-3 h-2 w-full bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-400 transition-all"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {showCTA && (
        <div className="mt-6 text-center">
          <p className="text-lg font-semibold">
            Keep listening in Selfward
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Get the full experience and personalized audio.
          </p>

          <a
            href="selfward://"
            className="block mt-4 rounded-full bg-green-500 py-4 text-black font-semibold text-lg"
          >
            Open in Selfward
          </a>

          {/* NEW secondary CTA */}
          <a
            href="/"
            className="block mt-3 text-sm text-gray-400 underline"
          >
            Get your first boost
          </a>
        </div>
      )}
    </div>
  );
}