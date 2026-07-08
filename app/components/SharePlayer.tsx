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
    typeof previewStartSec === "number" ? previewStartSec : 0;

  const resolvedPreviewEnd =
    typeof previewEndSec === "number"
      ? previewEndSec
      : getDefaultPreviewEnd(contentType);

  const safePreviewStart = Math.max(resolvedPreviewStart, 0);
  const safePreviewEnd = Math.max(resolvedPreviewEnd, safePreviewStart + 1);
  const previewLengthSeconds = Math.max(safePreviewEnd - safePreviewStart, 1);

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

    const previewLength = previewLengthSeconds;
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

  const handleOpenInSelfward = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    posthog.capture("share_open_in_selfward_clicked", {
      ...baseProps,
      app_deep_link: appDeepLink,
    });

    setTimeout(() => {
      window.location.href = appDeepLink;
    }, 500);
  };

  return (
    <div className="mt-7 flex w-full flex-col items-center">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />

      <button
        onClick={handlePlayPause}
        className="w-full max-w-sm rounded-full bg-[#F97316] py-4 text-base font-black text-white shadow-[0_10px_26px_rgba(249,115,22,0.18)] transition hover:-translate-y-0.5 hover:bg-[#fb8a3c] focus:outline-none focus:ring-2 focus:ring-orange-300/60"
      >
        {isPlaying ? "Pause" : showCTA ? "Replay preview" : "Listen now"}
      </button>

      <div className="mt-3 w-full max-w-sm">
        <div className="mb-2 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.18em] text-white/38">
          <span>{showCTA ? "Preview complete" : "Short preview"}</span>
          <span>{Math.round(previewLengthSeconds)} sec</span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[#F97316] transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {showCTA && (
        <div className="mt-7 w-full max-w-sm text-center">
          <p className="text-lg font-black text-white">
            Finish listening in Selfward
          </p>

          <p className="mt-1 text-sm font-medium leading-6 text-white/52">
            You heard a short preview. Open Selfward to hear the full boost and keep what helped close.
          </p>

          <a
            href={appDeepLink}
            onClick={handleOpenInSelfward}
            className="mt-5 block w-full rounded-full bg-[#F97316]/95 py-4 text-base font-black text-white shadow-[0_8px_22px_rgba(249,115,22,0.18)] transition hover:-translate-y-0.5 hover:bg-[#fb8a3c] focus:outline-none focus:ring-2 focus:ring-orange-300/60"
          >
            <span className="text-white">Finish in Selfward</span>
          </a>

          <a
            href="/coming-soon"
            onClick={() =>
              posthog.capture("share_get_first_boost_clicked", baseProps)
            }
            className="mt-4 block text-sm font-semibold text-orange-200/90 underline-offset-4 transition hover:text-orange-300 hover:underline"
          >
            New to Selfward? Get your first boost
          </a>
        </div>
      )}
    </div>
  );
}