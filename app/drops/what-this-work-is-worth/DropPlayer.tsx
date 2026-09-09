"use client";

import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";

type Props = {
  audioUrl: string;
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function getAudioDuration(audio: HTMLAudioElement) {
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    return audio.duration;
  }

  if (audio.seekable.length > 0) {
    const seekableEnd = audio.seekable.end(audio.seekable.length - 1);

    if (Number.isFinite(seekableEnd) && seekableEnd > 0) {
      return seekableEnd;
    }
  }

  return 0;
}

export default function DropPlayer({ audioUrl }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasStartedRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(7 * 60);
  const [showShare, setShowShare] = useState(false);
  const [shareStatus, setShareStatus] = useState("");

  const syncDuration = (audio: HTMLAudioElement) => {
    const nextDuration = getAudioDuration(audio);

    if (nextDuration > 0) {
      setDuration(nextDuration);
    }
  };

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: "What This Work Is Worth",
      artist: "Heracles · Selfward",
      album: "Selfward",
    });

    const setAction = (
      action: MediaSessionAction,
      handler: MediaSessionActionHandler | null
    ) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Some browsers support only a subset of Media Session actions.
      }
    };

    setAction("play", () => {
      const audio = audioRef.current;
      if (!audio) return;

      if (audio.ended) {
        audio.currentTime = 0;
        setCurrentTime(0);
        setShowShare(false);
        setShareStatus("");
      }

      void audio.play();
    });

    setAction("pause", () => {
      audioRef.current?.pause();
    });

    setAction("seekbackward", (details) => {
      const audio = audioRef.current;
      if (!audio) return;

      const amount = details.seekOffset ?? 15;
      const nextTime = Math.max(audio.currentTime - amount, 0);

      audio.currentTime = nextTime;
      setCurrentTime(nextTime);
    });

    setAction("seekforward", (details) => {
      const audio = audioRef.current;
      if (!audio) return;

      const amount = details.seekOffset ?? 15;
      const knownDuration = getAudioDuration(audio) || 7 * 60;
      const nextTime = Math.min(audio.currentTime + amount, knownDuration);

      audio.currentTime = nextTime;
      setCurrentTime(nextTime);
    });

    setAction("seekto", (details) => {
      const audio = audioRef.current;
      if (!audio || typeof details.seekTime !== "number") return;

      const knownDuration = getAudioDuration(audio) || 7 * 60;
      const nextTime = Math.min(
        Math.max(details.seekTime, 0),
        knownDuration
      );

      audio.currentTime = nextTime;
      setCurrentTime(nextTime);
    });

    return () => {
      setAction("play", null);
      setAction("pause", null);
      setAction("seekbackward", null);
      setAction("seekforward", null);
      setAction("seekto", null);
    };
  }, []);

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);

      posthog.capture("drop_paused", {
        drop_slug: "what-this-work-is-worth",
        current_time_seconds: Math.round(audio.currentTime),
      });

      return;
    }

    try {
      if (
        Number.isFinite(duration) &&
        duration > 0 &&
        audio.currentTime >= duration - 0.25
      ) {
        audio.currentTime = 0;
        setCurrentTime(0);
        setShowShare(false);
        setShareStatus("");
      }

      await audio.play();
      setIsPlaying(true);

      if (!hasStartedRef.current) {
        hasStartedRef.current = true;

        posthog.capture("drop_play_started", {
          drop_slug: "what-this-work-is-worth",
        });
      } else {
        posthog.capture("drop_resumed", {
          drop_slug: "what-this-work-is-worth",
          current_time_seconds: Math.round(audio.currentTime),
        });
      }
    } catch (error) {
      console.error("Drop audio play failed:", error);

      posthog.capture("drop_play_failed", {
        drop_slug: "what-this-work-is-worth",
      });
    }
  };

  const handleSeek = (value: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(duration) || duration <= 0) return;

    const nextTime = Math.min(Math.max(value, 0), duration);

    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const seekBy = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const knownDuration = getAudioDuration(audio) || duration;
    const nextTime = Math.min(
      Math.max(audio.currentTime + seconds, 0),
      knownDuration
    );

    audio.currentTime = nextTime;
    setCurrentTime(nextTime);

    posthog.capture("drop_seek_clicked", {
      drop_slug: "what-this-work-is-worth",
      direction: seconds < 0 ? "backward" : "forward",
      seconds: Math.abs(seconds),
      current_time_seconds: Math.round(nextTime),
    });
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(duration);
    setShowShare(true);

    posthog.capture("drop_completed", {
      drop_slug: "what-this-work-is-worth",
      duration_seconds: Math.round(duration),
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: "What This Work Is Worth",
      text: "A reflection for CAC & MDT professionals from Selfward.",
      url,
    };

    setShareStatus("");

    posthog.capture("drop_share_clicked", {
      drop_slug: "what-this-work-is-worth",
    });

    if (navigator.share) {
      try {
        await navigator.share(shareData);

        posthog.capture("drop_share_completed", {
          drop_slug: "what-this-work-is-worth",
        });

        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Drop share failed:", error);
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setShareStatus("Link copied");

      posthog.capture("drop_share_link_copied", {
        drop_slug: "what-this-work-is-worth",
      });
    } catch (error) {
      console.error("Drop link copy failed:", error);
      setShareStatus("Unable to copy the link automatically");
    }
  };

  return (
    <div className="w-full">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        playsInline
        onLoadedMetadata={(event) => {
          syncDuration(event.currentTarget);
        }}
        onDurationChange={(event) => {
          syncDuration(event.currentTarget);
        }}
        onCanPlay={(event) => {
          syncDuration(event.currentTarget);
        }}
        onTimeUpdate={(event) => {
          const audio = event.currentTarget;
          const nextTime = audio.currentTime;
          const nextDuration = getAudioDuration(audio);

          setCurrentTime(nextTime);

          if (nextDuration > 0) {
            setDuration(nextDuration);

            if ("mediaSession" in navigator) {
              try {
                navigator.mediaSession.setPositionState({
                  duration: nextDuration,
                  playbackRate: audio.playbackRate || 1,
                  position: Math.min(nextTime, nextDuration),
                });
              } catch {
                // Ignore browsers without position-state support.
              }
            }
          }
        }}
        onPlay={() => {
          setIsPlaying(true);

          if ("mediaSession" in navigator) {
            navigator.mediaSession.playbackState = "playing";
          }
        }}
        onPause={() => {
          setIsPlaying(false);

          if ("mediaSession" in navigator) {
            navigator.mediaSession.playbackState = "paused";
          }
        }}
        onEnded={handleEnded}
      />

      <button
        type="button"
        onClick={handlePlayPause}
        className="flex w-full items-center justify-center gap-3 rounded-full bg-[#F97316] px-6 py-4 text-base font-black text-white shadow-[0_12px_32px_rgba(249,115,22,0.22)] transition hover:-translate-y-0.5 hover:bg-[#fb8a3c] focus:outline-none focus:ring-2 focus:ring-orange-300/70"
      >
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/14"
        >
          {isPlaying ? "Ⅱ" : "▶"}
        </span>

        {isPlaying ? "Pause reflection" : "Listen to the reflection"}
      </button>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => seekBy(-15)}
          className="flex-1 rounded-full border border-white/12 bg-white/[0.045] px-4 py-2.5 text-xs font-black text-white/65 transition hover:bg-white/[0.08] hover:text-white"
          aria-label="Go back 15 seconds"
        >
          ↶ 15 sec
        </button>

        <button
          type="button"
          onClick={() => seekBy(15)}
          className="flex-1 rounded-full border border-white/12 bg-white/[0.045] px-4 py-2.5 text-xs font-black text-white/65 transition hover:bg-white/[0.08] hover:text-white"
          aria-label="Go forward 15 seconds"
        >
          15 sec ↷
        </button>
      </div>

      <div className="mt-5">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(currentTime, duration || 0)}
          onChange={(event) => handleSeek(Number(event.target.value))}
          aria-label="Audio progress"
          className="w-full cursor-pointer accent-[#F97316]"
        />

        <div className="mt-2 flex items-center justify-between text-xs font-bold tabular-nums text-white/45">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {showShare && (
        <div className="mt-8 border-t border-white/10 pt-7 text-center">
          <p className="text-base font-black text-white">
            Know someone in this work who might need this?
          </p>

          <p className="mx-auto mt-2 max-w-sm text-sm font-semibold leading-6 text-white/48">
            Send them this reflection.
          </p>

          <button
            type="button"
            onClick={handleShare}
            className="mt-5 w-full rounded-full border border-white/16 bg-white/[0.055] px-6 py-3.5 text-sm font-black text-white/90 transition hover:-translate-y-0.5 hover:bg-white/[0.09] focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            Share this reflection
          </button>

          {shareStatus && (
            <p className="mt-3 text-xs font-bold text-white/45">
              {shareStatus}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
