"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
    createAndReviewBoostFromContentOps,
    reviseAndReviewBoostFromContentOps,
} from "./actions";

type Props = {
    boostId: string;
    status: string;
    scriptDraft: string | null;
    finalScript: string | null;
    editorVerdict: string | null;
    editorNotes: string | null;
    curatorAction: string | null;
    revisionCount: number | null;
    contentId: string | null;
};

function statusLabel(status: string) {
    switch (status) {
        case "architected":
            return "Ready for Script Writer";
        case "drafted":
            return "Draft ready for Voice Editor";
        case "editor_approved":
            return "Voice review complete";
        case "revision_needed":
            return "Revision requested";
        case "human_safety_review":
            return "Human safety review";
        default:
            return status.replaceAll("_", " ");
    }
}

export default function BoostCreativePipeline({
    boostId,
    status,
    scriptDraft,
    finalScript,
    editorVerdict,
    editorNotes,
    curatorAction,
    revisionCount,
    contentId,
}: Props) {
    const router = useRouter();

    const [isRunning, setIsRunning] = useState(false);
    const [isRevising, setIsRevising] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    if (
        ![
            "architected",
            "drafted",
            "editor_approved",
            "revision_needed",
            "human_safety_review",
        ].includes(status)
    ) {
        return null;
    }

    /*
      A revision requested by Curator has a different
      production path from a Voice Editor revision.
      Its controls live in the Curator panel.
    */
    if (
        status === "revision_needed" &&
        curatorAction
    ) {
        return null;
    }

    async function handleCreateAndReview() {
        if (isRunning || isRevising) return;

        const confirmed = window.confirm(
            status === "architected"
                ? "Create and review this Boost? The Script Writer will draft this Boost, then the assigned Trusted Voice Editor will review it. This will not run the Curator, approve it for recording, create audio, publish, or release anything."
                : "Review this existing Boost draft? The assigned Trusted Voice Editor will review the current draft. This will not run the Curator, approve it for recording, create audio, publish, or release anything."
        );

        if (!confirmed) return;

        setIsRunning(true);
        setError(null);
        setMessage(null);

        try {
            const result =
                await createAndReviewBoostFromContentOps({
                    boostId,
                });

            if (result.outcome === "approved") {
                setMessage(
                    "The Boost completed Writer and Voice Editor review. Review the approved script before continuing."
                );
            } else if (
                result.outcome === "revision_needed"
            ) {
                setMessage(
                    "The Voice Editor requested a revision. Review the feedback before running the revision."
                );
            } else {
                setMessage(
                    "The creative pipeline paused for human safety review."
                );
            }

            router.refresh();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "The Boost creative pipeline could not finish."
            );
            router.refresh();
        } finally {
            setIsRunning(false);
        }
    }

    async function handleReviseAndReview() {
        if (isRunning || isRevising) return;

        const confirmed = window.confirm(
            "Revise and re-review this Boost only? The Writer will revise the rejected draft using the Voice Editor feedback, then the assigned Trusted Voice Editor will review the new draft again. This will not run the Curator, approve it for recording, create audio, publish, or release anything."
        );

        if (!confirmed) return;

        setIsRevising(true);
        setError(null);
        setMessage(null);

        try {
            const result =
                await reviseAndReviewBoostFromContentOps({
                    boostId,
                });

            if (result.outcome === "approved") {
                setMessage(
                    "The Boost was revised and approved by the Voice Editor. Review the approved script before continuing."
                );
            } else if (
                result.outcome === "revision_needed"
            ) {
                setMessage(
                    "The Boost was revised and re-reviewed, but the Voice Editor requested another revision. Review the new feedback before running another revision."
                );
            } else {
                setMessage(
                    "The revised Boost paused for human safety review."
                );
            }

            router.refresh();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "The Boost revision could not finish."
            );
            router.refresh();
        } finally {
            setIsRevising(false);
        }
    }

    return (
        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFB59A]">
                        Creative Pipeline Controls
                    </p>

                    <h2 className="mt-2 text-xl font-black">
                        {statusLabel(status)}
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/45">
                        Creative automation stops after Voice Editor
                        review. Curator review, human approval, media
                        production, and release remain separate human
                        checkpoints.
                    </p>
                </div>

                {(status === "architected" ||
                    status === "drafted") &&
                    !contentId && (
                        <button
                            type="button"
                            onClick={handleCreateAndReview}
                            disabled={isRunning || isRevising}
                            className="shrink-0 rounded-full bg-[#FFB59A] px-5 py-3 text-sm font-black text-[#0B1220] transition hover:bg-[#ffc5af] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isRunning
                                ? status === "architected"
                                    ? "Creating & Reviewing..."
                                    : "Reviewing..."
                                : status === "architected"
                                  ? "Create & Review Boost"
                                  : "Review Draft"}
                        </button>
                    )}

                {status === "editor_approved" &&
                    finalScript?.trim() && (
                        <div className="shrink-0 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-300">
                            ✓ Voice review complete
                        </div>
                    )}
            </div>

            {status === "revision_needed" && (
                <div className="mt-6 rounded-[22px] border border-amber-300/25 bg-amber-300/[0.07] p-5">
                    <p className="text-sm font-black text-amber-200">
                        Revision Requested
                    </p>

                    <p className="mt-2 text-xs font-bold text-white/40">
                        Completed automated revisions:{" "}
                        {revisionCount ?? 0}
                    </p>

                    {editorVerdict && (
                        <p className="mt-3 text-sm font-bold text-white/60">
                            Voice Editor verdict: {editorVerdict}
                        </p>
                    )}

                    {editorNotes && (
                        <details className="mt-4 rounded-2xl border border-white/10 bg-black/10 p-4">
                            <summary className="cursor-pointer text-sm font-black text-white/70">
                                Voice Editor feedback
                            </summary>

                            <div className="mt-4 whitespace-pre-wrap text-sm font-semibold leading-7 text-white/60">
                                {editorNotes}
                            </div>
                        </details>
                    )}

                    {scriptDraft && (
                        <details className="mt-3 rounded-2xl border border-white/10 bg-black/10 p-4">
                            <summary className="cursor-pointer text-sm font-black text-white/70">
                                Rejected draft
                            </summary>

                            <div className="mt-4 whitespace-pre-wrap text-sm font-semibold leading-7 text-white/60">
                                {scriptDraft}
                            </div>
                        </details>
                    )}

                    <button
                        type="button"
                        onClick={handleReviseAndReview}
                        disabled={isRunning || isRevising}
                        className="mt-5 inline-flex rounded-full bg-amber-300 px-5 py-3 text-sm font-black text-[#0B1220] transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isRevising
                            ? "Revising & Re-reviewing..."
                            : "Revise & Re-review Boost"}
                    </button>
                </div>
            )}

            {status === "human_safety_review" && (
                <div className="mt-6 rounded-[22px] border border-red-400/20 bg-red-400/10 p-5">
                    <p className="font-black text-red-100">
                        Human safety review required
                    </p>

                    <p className="mt-2 text-sm font-semibold leading-6 text-red-100/65">
                        Automatic creative production is paused. No
                        Writer, Voice Editor, Curator, recording, or
                        release action will continue automatically.
                    </p>
                </div>
            )}

            {message && (
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/65">
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
