"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
    moveFeaturedJourneyFromContentOps,
    releaseJourneyFromContentOps,
    setJourneyFeaturedFromContentOps,
    setJourneyPrioritySlotFromContentOps,
} from "./actions";

type BaseProps = {
    journeyId: string;
    title: string;
};

export function ReleaseJourneyButton({
    journeyId,
    title,
}: BaseProps) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [errorMessage, setErrorMessage] =
        useState<string | null>(null);

    async function handleRelease() {
        const confirmed = window.confirm(
            `Make “${title}” live in Selfward?\n\nThis will make the Journey available to listeners.`
        );

        if (!confirmed) return;

        setBusy(true);
        setErrorMessage(null);

        try {
            await releaseJourneyFromContentOps({
                journeyId,
            });

            router.refresh();
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Unable to make this Journey live."
            );
        } finally {
            setBusy(false);
        }
    }

    return (
        <div>
            <button
                type="button"
                onClick={handleRelease}
                disabled={busy}
                className="inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-black text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {busy ? "Making Live…" : "Make Live"}
            </button>

            {errorMessage && (
                <p className="mt-2 max-w-sm text-sm font-bold text-red-200">
                    {errorMessage}
                </p>
            )}
        </div>
    );
}

export function FeaturedJourneyButton({
    journeyId,
    title,
    isFeatured,
}: BaseProps & {
    isFeatured: boolean;
}) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [errorMessage, setErrorMessage] =
        useState<string | null>(null);

    async function handleFeaturedChange() {
        const nextFeatured = !isFeatured;

        const confirmed = window.confirm(
            nextFeatured
                ? `Make “${title}” a Featured Journey?`
                : `Remove “${title}” from Featured Journeys?`
        );

        if (!confirmed) return;

        setBusy(true);
        setErrorMessage(null);

        try {
            await setJourneyFeaturedFromContentOps({
                journeyId,
                isFeatured: nextFeatured,
            });

            router.refresh();
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Unable to update Featured status."
            );
        } finally {
            setBusy(false);
        }
    }

    return (
        <div>
            <button
                type="button"
                onClick={handleFeaturedChange}
                disabled={busy}
                className={
                    isFeatured
                        ? "inline-flex rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-sm font-black text-white transition hover:bg-white/[0.12] disabled:opacity-50"
                        : "inline-flex rounded-full bg-[#F97316] px-4 py-2 text-sm font-black text-white transition hover:bg-[#fb8a3c] disabled:opacity-50"
                }
            >
                {busy
                    ? "Updating…"
                    : isFeatured
                        ? "Remove Featured"
                        : "Make Featured"}
            </button>

            {errorMessage && (
                <p className="mt-2 max-w-sm text-sm font-bold text-red-200">
                    {errorMessage}
                </p>
            )}
        </div>
    );
}

export function FeaturedOrderControls({
    journeyId,
    title,
    position,
    isFirst,
    isLast,
}: BaseProps & {
    position: number;
    isFirst: boolean;
    isLast: boolean;
}) {
    const router = useRouter();
    const [busyDirection, setBusyDirection] =
        useState<"up" | "down" | null>(null);

    const [errorMessage, setErrorMessage] =
        useState<string | null>(null);

    async function handleMove(
        direction: "up" | "down"
    ) {
        if (busyDirection) return;

        const confirmed = window.confirm(
            direction === "up"
                ? `Move “${title}” up from Featured position ${position}?`
                : `Move “${title}” down from Featured position ${position}?`
        );

        if (!confirmed) return;

        setBusyDirection(direction);
        setErrorMessage(null);

        try {
            await moveFeaturedJourneyFromContentOps({
                journeyId,
                direction,
            });

            router.refresh();
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Unable to reorder Featured Journeys."
            );
        } finally {
            setBusyDirection(null);
        }
    }

    return (
        <div>
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={() => handleMove("up")}
                    disabled={isFirst || Boolean(busyDirection)}
                    className="inline-flex rounded-full border border-white/10 bg-white/[0.07] px-3.5 py-2 text-sm font-black text-white transition hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-30"
                >
                    {busyDirection === "up"
                        ? "Moving…"
                        : "↑ Move Up"}
                </button>

                <button
                    type="button"
                    onClick={() => handleMove("down")}
                    disabled={isLast || Boolean(busyDirection)}
                    className="inline-flex rounded-full border border-white/10 bg-white/[0.07] px-3.5 py-2 text-sm font-black text-white transition hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-30"
                >
                    {busyDirection === "down"
                        ? "Moving…"
                        : "↓ Move Down"}
                </button>
            </div>

            {errorMessage && (
                <p className="mt-2 max-w-sm text-sm font-bold text-red-200">
                    {errorMessage}
                </p>
            )}
        </div>
    );
}

type PriorityJourneyOption = {
    id: string;
    title: string;
    priority: number | null;
};

export function PriorityJourneySlot({
    position,
    currentJourneyId,
    currentJourneyTitle,
    options,
}: {
    position: number;
    currentJourneyId: string | null;
    currentJourneyTitle: string | null;
    options: PriorityJourneyOption[];
}) {
    const router = useRouter();

    const [selectedJourneyId, setSelectedJourneyId] =
        useState(currentJourneyId ?? "");

    const [busy, setBusy] = useState(false);
    const [errorMessage, setErrorMessage] =
        useState<string | null>(null);

    useEffect(() => {
        setSelectedJourneyId(currentJourneyId ?? "");
    }, [currentJourneyId]);

    async function handleChange(nextJourneyId: string) {
        if (
            !nextJourneyId ||
            nextJourneyId === currentJourneyId ||
            busy
        ) {
            return;
        }

        const selectedJourney = options.find(
            (journey) => journey.id === nextJourneyId
        );

        if (!selectedJourney) {
            setSelectedJourneyId(currentJourneyId ?? "");
            return;
        }

        setSelectedJourneyId(nextJourneyId);

        const confirmed = window.confirm(
            `Set “${selectedJourney.title}” as Priority position ${position}?\n\n` +
            `Current: ${currentJourneyTitle ?? "No Journey assigned"}\n\n` +
            `If the selected Journey already has another Top 5 position, the two Journeys will swap.`
        );

        if (!confirmed) {
            setSelectedJourneyId(currentJourneyId ?? "");
            return;
        }

        setBusy(true);
        setErrorMessage(null);

        try {
            await setJourneyPrioritySlotFromContentOps({
                journeyId: nextJourneyId,
                priority: position,
            });

            router.refresh();
        } catch (error) {
            setSelectedJourneyId(currentJourneyId ?? "");

            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Unable to update Journey priority."
            );
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="rounded-2xl border border-white/[0.08] bg-black/10 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#FFB59A]/20 bg-[#FFB59A]/10 text-sm font-black text-[#FFB59A]">
                    {position}
                </div>

                <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-white/35">
                        Priority {position}
                    </p>

                    <p className="mt-1 truncate font-black text-white/85">
                        {currentJourneyTitle ?? "No Journey assigned"}
                    </p>
                </div>

                <select
                    value={selectedJourneyId}
                    disabled={busy}
                    onChange={(event) =>
                        handleChange(event.target.value)
                    }
                    className="min-w-0 rounded-xl border border-white/10 bg-[#111A2B] px-4 py-2.5 text-sm font-bold text-white outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:w-[320px]"
                >
                    {!currentJourneyId && (
                        <option value="">
                            Choose a Journey
                        </option>
                    )}

                    {options.map((journey) => (
                        <option
                            key={journey.id}
                            value={journey.id}
                        >
                            {journey.title}
                            {journey.priority &&
                                journey.priority >= 1 &&
                                journey.priority <= 5
                                ? ` — currently #${journey.priority}`
                                : ""}
                        </option>
                    ))}
                </select>
            </div>

            {busy && (
                <p className="mt-2 text-xs font-bold text-white/40">
                    Updating priority…
                </p>
            )}

            {errorMessage && (
                <p className="mt-2 text-sm font-bold text-red-200">
                    {errorMessage}
                </p>
            )}
        </div>
    );
}