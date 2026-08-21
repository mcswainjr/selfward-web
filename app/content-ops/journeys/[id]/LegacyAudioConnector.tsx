"use client";

import { useState } from "react";
import { connectLegacyAudio } from "./actions";

type LegacyAudioConnectorProps = {
    journeyId: string;
    stepId: string;
    storageObjectName: string;
    audioUrl: string;
};

function formatDuration(seconds: number | null) {
    if (!seconds || seconds <= 0) {
        return "Loading duration…";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${remainingSeconds
        .toString()
        .padStart(2, "0")}`;
}

export default function LegacyAudioConnector({
    journeyId,
    stepId,
    storageObjectName,
    audioUrl,
}: LegacyAudioConnectorProps) {
    const [durationSeconds, setDurationSeconds] =
        useState<number | null>(null);

    function handleLoadedMetadata(
        event: React.SyntheticEvent<HTMLAudioElement>
    ) {
        const duration = event.currentTarget.duration;

        if (
            Number.isFinite(duration) &&
            duration > 0
        ) {
            setDurationSeconds(Math.round(duration));
        }
    }

    return (
        <section className="mt-5 rounded-[22px] border border-violet-400/20 bg-violet-400/[0.07] p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-200">
                Existing Audio Found
            </p>

            <p className="mt-3 break-all text-xs font-bold leading-5 text-white/45">
                {storageObjectName}
            </p>

            <audio
                controls
                preload="metadata"
                src={audioUrl}
                onLoadedMetadata={handleLoadedMetadata}
                className="mt-4 w-full"
            />

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-white/35">
                        Duration
                    </p>

                    <p className="mt-1 font-black text-white/80">
                        {formatDuration(durationSeconds)}
                    </p>
                </div>

                <form action={connectLegacyAudio}>
                    <input
                        type="hidden"
                        name="journey_id"
                        value={journeyId}
                    />

                    <input
                        type="hidden"
                        name="step_id"
                        value={stepId}
                    />

                    <input
                        type="hidden"
                        name="storage_object_name"
                        value={storageObjectName}
                    />

                    <input
                        type="hidden"
                        name="duration_seconds"
                        value={durationSeconds ?? ""}
                    />

                    <button
                        type="submit"
                        disabled={!durationSeconds}
                        className="rounded-full bg-[#F97316] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#fb8a3c] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Connect Audio
                    </button>
                </form>
            </div>

            <p className="mt-4 text-xs font-bold leading-5 text-white/30">
                This will connect the existing MP3 to this Journey day. It will
                not release the Journey or change its scripts.
            </p>
        </section>
    );
}