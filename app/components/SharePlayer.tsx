"use client";

import posthog from "posthog-js";
import { useRef, useState } from "react";

type Props = {
  audioUrl: string;
  appDeepLink: string;
  shareId: string;
  contentType?: string | null;
  previewStartSec?: number | null;
  previewEndSec?: number | null;
};

export default function SharePlayer({
  audioUrl,
  appDeepLink,
  shareId,
  contentType,
  previewStartSec,
  previewEndSec,
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showCTA, setShowCTA] = useState(false);

  const SHORT_AUDIO_THRESHOLD = 10;

  const getDefaultPreviewStart = (type?: string | null) => {
    switch (type) {
      case "affirmation":
      case "story":
      case "meditation":
      default:
        return 0;
    }
  };

  const getDefaultPreviewEnd = (type?: string | null) => {
    switch (type) {
      case "affirmation":
        return 8;
      case "story":
        return 30;
      case "meditation":
        return 40;
      default:
        return 8;
    }
  };

  const resolvedPreviewStart =
    typeof previewStartSec === "number"
      ? previewStartSec
      : getDefaultPreviewStart(contentType);

  const resolvedPreviewEnd =
    typeof previewEndSec === "number"
      ? previewEndSec
      : getDefaultPreviewEnd(contentType);

  const safePreviewStart = Math.max(resolvedPreviewStart, 0);
  const safePreviewEnd = Math.max(resolvedPreviewEnd, safePreviewStart + 1);

  const baseProps = {
    audio_url: audioUrl,
    share_id: shareId,
    content_type: contentType ?? "unknown",
    preview_start_seconds: safePreviewStart,
    preview_end_seconds: safePreviewEnd,
  };

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      posthog.capture("share_preview_paused", baseProps);
      return;
    }

    try {
      if (safePreviewStart > 0 && audio.currentTime < safePreviewStart) {
        audio.currentTime = safePreviewStart;
      }

      await audio.play();
      setIsPlaying(true);
      posthog.capture("share_preview_play_clicked", baseProps);
    } catch (err) {
      console.error("Audio play failed:", err);
      posthog.capture("share_preview_play_failed", baseProps);
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const previewLength = Math.max(safePreviewEnd - safePreviewStart, 1);
    const previewProgress = Math.min(
      Math.max((audio.currentTime - safePreviewStart) / previewLength, 0),
      1
    );

    setProgress(previewProgress);

    if (
      audio.duration > SHORT_AUDIO_THRESHOLD &&
      audio.currentTime >= safePreviewEnd
    ) {
      audio.pause();
      setIsPlaying(false);
      setShowCTA(true);
      setProgress(1);
      posthog.capture("share_preview_cutoff_reached", baseProps);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(1);
    setShowCTA(true);
    posthog.capture("share_preview_completed", baseProps);
  };

  const handleOpenInSelfward = (
    e: React.MouseEvent<HTMLAnchorElement>
  ) => {
    e.preventDefault();

    posthog.capture("share_open_in_selfward_clicked", {
      ...baseProps,
      app_deep_link: appDeepLink,
    });

    setTimeout(() => {
      window.location.href = appDeepLink;
    }, 800);
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
              posthog.capture("share_get_first_boost_clicked", baseProps)
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