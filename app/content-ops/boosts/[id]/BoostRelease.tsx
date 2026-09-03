"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
    releaseBoostFromContentOps,
} from "./actions";

type Props = {
    boostId: string;
    boostTitle: string;
    status: string;
    contentId: string | null;
    contentIsActive: boolean | null;
    publishedAt: string | null;
    unpublishedAt: string | null;
    editorStatus: string | null;
    productionStatus: string | null;
    audioUrl: string | null;
    durationSeconds: number | null;
};

export default function BoostRelease({
    boostId,
    boostTitle,
    status,
    contentId,
    contentIsActive,
    publishedAt,
    unpublishedAt,
    editorStatus,
    productionStatus,
    audioUrl,
    durationSeconds,
}: Props) {
    const router = useRouter();

    const [isReleasing, setIsReleasing] =
        useState(false);

    const [message, setMessage] =
        useState<string | null>(null);

    const [error, setError] =
        useState<string | null>(null);

    const hasValidAudio =
        !!audioUrl?.trim() &&
        Number.isInteger(durationSeconds) &&
        (durationSeconds ?? 0) > 0 &&
        (durationSeconds ?? 0) <= 7200;

    const readyToRelease =
        status === "recorded" &&
        !!contentId &&
        contentIsActive !== true &&
        !publishedAt &&
        !unpublishedAt &&
        editorStatus === "approved" &&
        productionStatus === "ready" &&
        hasValidAudio;

    const released =
        status === "published" &&
        !!contentId &&
        contentIsActive === true &&
        !!publishedAt;

    /*
      This control belongs only at the explicit first-release
      boundary.

      Unexpected or incomplete production states do not receive
      a release button. The server action and database RPC still
      independently enforce the authoritative release guards.
    */
    if (!readyToRelease && !released) {
        return null;
    }

    async function handleRelease() {
        if (!readyToRelease || isReleasing) {
            return;
        }

        const confirmed = window.confirm(
            `Release "${boostTitle}" now?\n\n` +
            "This is the listener-facing release. " +
            "The Boost will become available to listeners immediately.\n\n" +
            "Finished audio and the recording script are already locked into the playable content record. " +
            "This action is intentionally separate from recording completion."
        );

        if (!confirmed) {
            return;
        }

        setIsReleasing(true);
        setMessage(null);
        setError(null);

        try {
            const result =
                await releaseBoostFromContentOps({
                    boostId,
                });

            if (result.outcome === "published") {
                setMessage(
                    "Boost release completed. The linked content is now listener-visible."
                );
            }

            router.refresh();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Boost release could not be completed."
            );

            /*
              Refresh even after an error.

              If the browser lost contact after the database
              committed, the refreshed page should show the
              authoritative production state rather than leaving
              stale recorded-state UI on screen.
            */
            router.refresh();
        } finally {
            setIsReleasing(false);
        }
    }

    if (released) {
        return (
            <section className="mt-8 rounded-[28px] border border-emerald-400/25 bg-emerald-400/[0.08] p-6 sm:p-7">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">
                    Release
                </p>

                <h2 className="mt-2 text-xl font-black">
                    Boost released
                </h2>

                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-emerald-100/65">
                    This standalone Boost is active and available
                    to listeners.
                </p>
            </section>
        );
    }

    return (
        <section className="mt-8 rounded-[28px] border border-amber-300/25 bg-amber-300/[0.07] p-6 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-200">
                        Final Release
                    </p>

                    <h2 className="mt-2 text-xl font-black">
                        Ready for listener release
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/55">
                        Finished audio is connected and the Boost
                        is still dormant. Releasing it will make
                        this content available to listeners
                        immediately.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleRelease}
                    disabled={isReleasing}
                    className="shrink-0 rounded-full bg-amber-300 px-5 py-3 text-sm font-black text-[#0B1220] transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isReleasing
                        ? "Releasing..."
                        : "Release Boost"}
                </button>
            </div>

            <div className="mt-6 rounded-[22px] border border-amber-300/20 bg-black/10 p-5">
                <p className="font-black text-amber-100">
                    This is the visibility boundary
                </p>

                <p className="mt-2 text-sm font-semibold leading-6 text-white/55">
                    This action changes the linked content from
                    dormant to active. It is not part of audio
                    upload or recording completion and will never
                    run automatically.
                </p>
            </div>

            {message && (
                <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-100">
                    {message}
                </div>
            )}

            {error && (
                <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-200">
                    {error}
                </div>
            )}
        </section>
    );
}
