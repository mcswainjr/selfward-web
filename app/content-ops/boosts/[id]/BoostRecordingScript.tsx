"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
    reviewBoostRecordingRewriteFromContentOps,
    saveBoostRecordingScript,
} from "./actions";

type Props = {
    boostId: string;
    status: string;
    finalScript: string | null;
    recordingScript: string | null;
    editorVerdict: string | null;
    editorNotes: string | null;
    contentId: string | null;
};

export default function BoostRecordingScript({
    boostId,
    status,
    finalScript,
    recordingScript,
    editorVerdict,
    editorNotes,
    contentId,
}: Props) {
    const router = useRouter();

    const hasRecordingRewriteCandidate =
        status === "revision_needed" &&
        Boolean(recordingScript?.trim());

    const isRecordingRewriteAwaitingReview =
        hasRecordingRewriteCandidate &&
        !editorVerdict;

    const isRecordingRewriteRevision =
        hasRecordingRewriteCandidate &&
        editorVerdict === "REVISION NEEDED";

    const hasSavedRecordingScript =
        Boolean(recordingScript?.trim());

    /*
      Normalize to a string before initializing client state.
      Hooks must run before any conditional return.
    */
    const startingScript =
        recordingScript?.trim()
            ? recordingScript
            : finalScript ?? "";

    const [draft, setDraft] =
        useState<string>(startingScript);

    const [isReviewing, setIsReviewing] =
        useState(false);

    const [reviewMessage, setReviewMessage] =
        useState<string | null>(null);

    const [reviewError, setReviewError] =
        useState<string | null>(null);

    const hasUnsavedChanges =
        draft !== startingScript;

    /*
      If Voice Editor approval changes the authoritative
      recording copy, synchronize this editor to the new
      database value on refresh.
    */
    useEffect(() => {
        setDraft(startingScript);
    }, [startingScript]);

    if (
        (
            status !== "human_approved" &&
            !hasRecordingRewriteCandidate
        ) ||
        contentId ||
        !finalScript?.trim()
    ) {
        return null;
    }

    async function handleRecordingRewriteReview() {
        if (
            isReviewing ||
            !hasSavedRecordingScript ||
            hasUnsavedChanges
        ) {
            return;
        }

        const confirmed = window.confirm(
            isRecordingRewriteRevision
                ? "Resubmit this recording rewrite to the assigned Trusted Voice Editor? The Editor will review these exact saved words again. The Architect and Writer will not run. Curator review, human approval, audio connection, publication, and release remain separate checkpoints."
                : "Send this recording rewrite to the assigned Trusted Voice Editor? Use this when the recording copy contains substantive wording changes, not only pauses, punctuation, pronunciation cues, or spoken-flow formatting. Sending it for review invalidates the previous current Voice Editor/Curator approval state. The Architect and Writer will not run. Audio will not be connected, published, or released."
        );

        if (!confirmed) return;

        setIsReviewing(true);
        setReviewMessage(null);
        setReviewError(null);

        try {
            const result =
                await reviewBoostRecordingRewriteFromContentOps({
                    boostId,
                });

            if (result.outcome === "approved") {
                setReviewMessage(
                    "The recording rewrite was approved by the Trusted Voice Editor. Continue to a new Curator review."
                );
            } else if (
                result.outcome === "revision_needed"
            ) {
                setReviewMessage(
                    "The Trusted Voice Editor requested changes to the recording rewrite. Review the feedback, edit this recording copy, save it, and resubmit."
                );
            } else {
                setReviewMessage(
                    "The recording rewrite paused for human safety review."
                );
            }

            router.refresh();
        } catch (err) {
            setReviewError(
                err instanceof Error
                    ? err.message
                    : "The recording rewrite could not be reviewed."
            );

            router.refresh();
        } finally {
            setIsReviewing(false);
        }
    }

    return (
        <section className="mt-8 rounded-[28px] border border-orange-400/20 bg-orange-400/[0.06] p-6 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFB59A]">
                        Media Production
                    </p>

                    <h2 className="mt-2 text-xl font-black text-white">
                        Recording Script
                    </h2>

                    <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/50">
                        Prepare the exact narration copy that
                        will be used for recording. Performance
                        adjustments such as punctuation, pauses,
                        contractions, pronunciation cues, or
                        spoken-flow formatting do not by
                        themselves require a new creative review.
                    </p>

                    <p className="mt-3 max-w-3xl text-xs font-bold leading-5 text-white/35">
                        If you materially change the wording,
                        meaning, emotional stance, or Trusted
                        Voice expression, save the new recording
                        copy and explicitly send it back through
                        Voice Editor review before connecting
                        finished audio.
                    </p>
                </div>

                {hasSavedRecordingScript ? (
                    <div className="shrink-0 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-300">
                        ✓ Recording copy saved
                    </div>
                ) : (
                    <div className="shrink-0 rounded-full border border-amber-300/20 bg-amber-300/[0.07] px-4 py-2 text-sm font-black text-amber-200">
                        Not saved yet
                    </div>
                )}
            </div>

            {isRecordingRewriteAwaitingReview && (
                <div className="mt-6 rounded-[22px] border border-[#FFB59A]/25 bg-[#FFB59A]/[0.07] p-5">
                    <p className="text-sm font-black text-[#FFD0BE]">
                        Recording Rewrite Awaiting Voice Review
                    </p>

                    <p className="mt-2 text-sm font-semibold leading-6 text-white/55">
                        The human-final wording changed after
                        Voice Editor approval. The previous
                        approval is no longer current. These
                        exact saved words must be reviewed by
                        the assigned Trusted Voice Editor before
                        Curator can continue.
                    </p>
                </div>
            )}

            {isRecordingRewriteRevision && (
                <div className="mt-6 rounded-[22px] border border-amber-300/25 bg-amber-300/[0.07] p-5">
                    <p className="text-sm font-black text-amber-200">
                        Recording Rewrite Needs Revision
                    </p>

                    <p className="mt-2 text-sm font-semibold leading-6 text-white/55">
                        The Trusted Voice Editor reviewed the
                        human-written recording copy and requested
                        changes. This revision stays in the
                        recording workflow — it does not return to
                        the Script Writer.
                    </p>

                    {editorVerdict && (
                        <p className="mt-3 text-xs font-black uppercase tracking-[0.12em] text-white/45">
                            Voice Editor verdict: {editorVerdict}
                        </p>
                    )}

                    {editorNotes && (
                        <details className="mt-4 rounded-2xl border border-white/10 bg-black/10 p-4">
                            <summary className="cursor-pointer text-sm font-black text-white/70">
                                Review Voice Editor feedback
                            </summary>

                            <pre className="mt-4 whitespace-pre-wrap font-sans text-sm font-semibold leading-6 text-white/55">
                                {editorNotes}
                            </pre>
                        </details>
                    )}
                </div>
            )}

            {!hasSavedRecordingScript && (
                <div className="mt-6 rounded-[18px] border border-white/[0.07] bg-black/10 p-4">
                    <p className="text-sm font-bold text-white/60">
                        Starting from the approved final script
                    </p>

                    <p className="mt-1 text-xs font-semibold leading-5 text-white/35">
                        This is only a starting value in the
                        editor. The database recording script
                        remains empty until you explicitly save.
                    </p>
                </div>
            )}

            <form
                action={saveBoostRecordingScript}
                className="mt-6"
            >
                <input
                    type="hidden"
                    name="boost_id"
                    value={boostId}
                />

                <label
                    htmlFor={`recording-script-${boostId}`}
                    className="text-xs font-black uppercase tracking-[0.16em] text-white/40"
                >
                    Human-final narration copy
                </label>

                <textarea
                    id={`recording-script-${boostId}`}
                    name="recording_script"
                    value={draft}
                    onChange={(event) => {
                        setDraft(event.target.value);
                        setReviewMessage(null);
                        setReviewError(null);
                    }}
                    rows={18}
                    required
                    className="mt-3 min-h-[420px] w-full resize-y rounded-[22px] border border-white/10 bg-[#0F1A2E] px-5 py-4 text-[15px] font-semibold leading-8 text-white/80 outline-none transition placeholder:text-white/20 focus:border-[#FFB59A]/50"
                />

                {hasUnsavedChanges && (
                    <div className="mt-3 rounded-[16px] border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3">
                        <p className="text-xs font-bold leading-5 text-amber-100/75">
                            You have unsaved recording-script
                            changes. Save them before sending this
                            copy for Voice Editor review.
                        </p>
                    </div>
                )}

                {reviewMessage && (
                    <div className="mt-4 rounded-[18px] border border-emerald-400/20 bg-emerald-400/[0.08] p-4">
                        <p className="text-sm font-bold leading-6 text-emerald-200">
                            {reviewMessage}
                        </p>
                    </div>
                )}

                {reviewError && (
                    <div className="mt-4 rounded-[18px] border border-red-400/20 bg-red-400/[0.08] p-4">
                        <p className="text-sm font-bold leading-6 text-red-200">
                            {reviewError}
                        </p>
                    </div>
                )}

                <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div className="max-w-2xl">
                        <p className="text-xs font-bold leading-5 text-white/30">
                            Saving the recording script does not
                            create audio, create playable content,
                            publish, release, or automatically
                            invalidate creative approval.
                        </p>

                        {hasSavedRecordingScript && (
                            <p className="mt-2 text-xs font-bold leading-5 text-white/40">
                                If this saved copy contains a
                                substantive rewrite, use the Voice
                                Editor review control before
                                connecting finished audio.
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <button
                            type="submit"
                            className="shrink-0 rounded-full bg-[#F97316] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#fb8a3c]"
                        >
                            {hasSavedRecordingScript
                                ? "Save Recording Script Changes"
                                : "Save Recording Script"}
                        </button>

                        {hasSavedRecordingScript && (
                            <button
                                type="button"
                                onClick={
                                    handleRecordingRewriteReview
                                }
                                disabled={
                                    isReviewing ||
                                    hasUnsavedChanges
                                }
                                className="shrink-0 rounded-full border border-[#FFB59A]/30 bg-[#FFB59A]/10 px-5 py-2.5 text-sm font-black text-[#FFD0BE] transition hover:bg-[#FFB59A]/15 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {isReviewing
                                    ? "Reviewing Rewrite..."
                                    : isRecordingRewriteRevision
                                      ? "Resubmit Recording Rewrite"
                                      : "Send Recording Rewrite for Review"}
                            </button>
                        )}
                    </div>
                </div>
            </form>
        </section>
    );
}
