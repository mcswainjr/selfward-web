"use client";

import posthog from "posthog-js";
import { useRef, useState } from "react";

type Props = {
  audioUrl: string;
  appDeepLink: string;
};

export default function SharePlayer({ audioUrl, appDeepLink }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showCTA, setShowCTA] = useState(false);

  const PREVIEW_LIMIT = 8;
  const SHORT_AUDIO_THRESHOLD = 10;

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      posthog.capture("share_preview_paused");
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
      posthog.capture("share_preview_play_clicked", {
        audio_url: audioUrl,
      });
    } catch (err) {
      console.error("Audio play failed:", err);
      posthog.capture("share_preview_play_failed", {
        audio_url: audioUrl,
      });
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const duration = audio.duration || 1;
    setProgress(audio.currentTime / duration);

    if (
      audio.duration > SHORT_AUDIO_THRESHOLD &&
      audio.currentTime >= PREVIEW_LIMIT
    ) {
      audio.pause();
      setIsPlaying(false);
      setShowCTA(true);
      posthog.capture("share_preview_cutoff_reached", {
        audio_url: audioUrl,
      });
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(1);
    setShowCTA(true);
    posthog.capture("share_preview_completed", {
      audio_url: audioUrl,
    });
  };

  const handleOpenInSelfward = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    posthog.capture(
      "share_open_in_selfward_clicked",
      {
        audio_url: audioUrl,
        app_deep_link: appDeepLink,
      },
      () => {
        window.location.href = appDeepLink;
      }
    );

    setTimeout(() => {
      window.location.href = appDeepLink;
    }, 300);
  };

  return (
    <div className="mt-6 w-full flex flex-col items-center">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />

      <button
        onClick={handlePlayPause}
        className="w-full max-w-sm rounded-full bg-emerald-500 py-4 text-black font-semibold text-lg"
      >
        {isPlaying ? "Pause" : "Play"}
      </button>

      <div className="mt-3 h-2 w-full max-w-sm bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-400 transition-all"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {showCTA && (
        <div className="mt-6 w-full max-w-sm text-center">
          <p className="text-lg font-semibold">Keep listening in Selfward</p>
          <p className="text-sm text-gray-400 mt-1">
            Get the full experience and personalized audio.
          </p>

          <a
            href={appDeepLink}
            onClick={handleOpenInSelfward}
            className="block w-full mt-4 rounded-full bg-emerald-500 py-4 text-black font-semibold text-lg"
          >
            Open in Selfward
          </a>

          <a
            href="/coming-soon"
            onClick={() =>
              posthog.capture("share_get_first_boost_clicked", {
                audio_url: audioUrl,
              })
            }
            className="block mt-3 text-sm text-gray-400 underline"
          >
            Get your first boost
          </a>
        </div>
      )}
    </div>
  );
}