"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
    curateBoostFromContentOps,
    reviseCuratorBoostAndReviewFromContentOps,
} from "./actions";

type Props = {
    boostId: string;
    status: string;
    finalScript: string | null;
    editorVerdict: string | null;
    curatorScore: number | null;
    curatorAction: string | null;
    curatorReason: string | null;
    contentId: string | null;
};

function currentLocalWeekStart() {
    const now = new Date();
    const day = now.getDay();

    const differenceFromMonday =
        day === 0 ? -6 : 1 - day;

    const monday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + differenceFromMonday
    );

    const year = monday.getFullYear();
    const month = String(
        monday.getMonth() + 1
    ).padStart(2, "0");
    const date = String(
        monday.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${date}`;
}

export default function BoostCuratorPipeline({
    boostId,
    status,
    finalScript,
    editorVerdict,
    curatorScore,
    curatorAction,
    curatorReason,
    contentId,
}: Props) {
    const router = useRouter();

    const [isCurating, setIsCurating] =
        useState(false);

    const [
        isRevising,
        setIsRevising,
    ] = useState(false);

    const [message, setMessage] =
        useState<string | null>(null);

    const [error, setError] =
        useState<string | null>(null);

    const isCuratorRevision =
        status === "revision_needed" &&
        curatorAction ===
            "SEND BACK FOR REVISION";

    const isWrongVoiceFit =
        status === "revision_needed" &&
        curatorAction ===
            "REVISION NEEDED — WRONG TRUSTED VOICE FIT";

    const isCuratorSafety =
        status === "human_safety_review" &&
        curatorAction ===
            "HUMAN SAFETY REVIEW";

    const shouldRender =
        (
            status === "editor_approved" &&
            Boolean(finalScript?.trim())
        ) ||
        status === "pending_human_approval" ||
        isCuratorRevision ||
        isWrongVoiceFit ||
        status === "rejected" ||
        isCuratorSafety;

    if (!shouldRender) {
        return null;
    }

    const busy =
        isCurating || isRevising;

    async function handleCurate() {
        if (busy) return;

        const confirmed = window.confirm(
            "Review this Boost with Curator? Curator will evaluate only this Boost for recording readiness. This will not human-approve it, create audio, publish, or release anything."
        );

        if (!confirmed) return;

        setIsCurating(true);
        setMessage(null);
        setError(null);

        try {
            const result =
                await curateBoostFromContentOps({
                    boostId,
                    weekStart:
                        currentLocalWeekStart(),
                });

            if (
                result.outcome ===
                "pending_human_approval"
            ) {
                setMessage(
                    "Curator selected this Boost for recording. Review the Curator decision before making the separate human approval decision."
                );
            } else if (
                result.outcome ===
                "curator_revision_needed"
            ) {
                setMessage(
                    "Curator sent this Boost back for revision. Review the Curator feedback before revising."
                );
            } else if (
                result.outcome ===
                "wrong_trusted_voice_fit"
            ) {
                setMessage(
                    "Curator identified a Trusted Voice fit problem. Automatic revision is intentionally stopped for a human decision."
                );
            } else if (
                result.outcome === "rejected"
            ) {
                setMessage(
                    "Curator rejected this Boost. No further production action was started."
                );
            } else {
                setMessage(
                    "Curator paused this Boost for human safety review."
                );
            }

            router.refresh();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Curator review could not finish."
            );

            router.refresh();
        } finally {
            setIsCurating(false);
        }
    }

    async function handleRevision() {
        if (busy) return;

        const confirmed = window.confirm(
            "Revise this Boost from Curator feedback? The same Trusted Voice Writer will revise the approved script, then the assigned Voice Editor will review the new draft. Curator will not run again automatically."
        );

        if (!confirmed) return;

        setIsRevising(true);
        setMessage(null);
        setError(null);

        try {
            const result =
                await reviseCuratorBoostAndReviewFromContentOps({
                    boostId,
                });

            if (result.outcome === "approved") {
                setMessage(
                    "The Curator revision was approved by the Voice Editor. Review the new final script before sending it back to Curator."
                );
            } else if (
                result.outcome ===
                "revision_needed"
            ) {
                setMessage(
                    "The Voice Editor requested another revision. Review the new Voice Editor feedback before continuing."
                );
            } else {
                setMessage(
                    "The Curator revision paused for human safety review."
                );
            }

            router.refresh();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "The Curator revision could not finish."
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
                        Curator Review
                    </p>

                    <h2 className="mt-2 text-xl font-black">
                        {status === "editor_approved"
                            ? "Ready for Curator"
                            : status ===
                                "pending_human_approval"
                              ? "Awaiting human approval"
                              : isCuratorRevision
                                ? "Curator revision requested"
                                : isWrongVoiceFit
                                  ? "Trusted Voice decision required"
                                  : status === "rejected"
                                    ? "Curator rejected"
                                    : "Human safety review"}
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/45">
                        Curator evaluates recording
                        readiness only. Human approval,
                        media production, publication, and
                        release remain separate checkpoints.
                    </p>
                </div>

                {status === "editor_approved" &&
                    finalScript?.trim() &&
                    !curatorAction &&
                    !contentId && (
                        <button
                            type="button"
                            onClick={handleCurate}
                            disabled={busy}
                            className="shrink-0 rounded-full bg-[#FFB59A] px-5 py-3 text-sm font-black text-[#0B1220] transition hover:bg-[#ffc5af] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isCurating
                                ? "Reviewing..."
                                : "Review with Curator"}
                        </button>
                    )}
            </div>

            {curatorScore !== null && (
                <p className="mt-5 text-sm font-bold text-white/55">
                    Curator score:{" "}
                    <span className="text-white/80">
                        {curatorScore}/100
                    </span>
                </p>
            )}

            {curatorAction && (
                <p className="mt-3 text-sm font-bold text-white/60">
                    Curator action:{" "}
                    <span className="text-white/80">
                        {curatorAction}
                    </span>
                </p>
            )}

            {curatorReason && (
                <details className="mt-4 rounded-2xl border border-white/10 bg-black/10 p-4">
                    <summary className="cursor-pointer text-sm font-black text-white/70">
                        Curator feedback
                    </summary>

                    <div className="mt-4 whitespace-pre-wrap text-sm font-semibold leading-7 text-white/60">
                        {curatorReason}
                    </div>
                </details>
            )}

            {status ===
                "pending_human_approval" && (
                <div className="mt-6 rounded-[22px] border border-emerald-400/25 bg-emerald-400/[0.08] p-5">
                    <p className="font-black text-emerald-200">
                        Curator review complete
                    </p>

                    <p className="mt-2 text-sm font-semibold leading-6 text-emerald-100/65">
                        This Boost has reached the human
                        recording-approval gate. Nothing
                        continues automatically.
                    </p>

                    {curatorAction ===
                        "APPROVE AFTER MICRO-EDITS" && (
                        <p className="mt-3 text-sm font-bold leading-6 text-amber-200">
                            Curator requested micro-edits
                            before recording approval.
                        </p>
                    )}
                </div>
            )}

            {isCuratorRevision && (
                <div className="mt-6 rounded-[22px] border border-amber-300/25 bg-amber-300/[0.07] p-5">
                    <p className="font-black text-amber-200">
                        Curator sent this Boost back
                    </p>

                    <p className="mt-2 text-sm font-semibold leading-6 text-white/55">
                        Review the Curator feedback before
                        starting the production revision.
                    </p>

                    <button
                        type="button"
                        onClick={handleRevision}
                        disabled={busy}
                        className="mt-5 rounded-full bg-amber-300 px-5 py-3 text-sm font-black text-[#0B1220] transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isRevising
                            ? "Revising & Re-reviewing..."
                            : "Revise from Curator & Re-review"}
                    </button>
                </div>
            )}

            {isWrongVoiceFit && (
                <div className="mt-6 rounded-[22px] border border-red-400/20 bg-red-400/10 p-5">
                    <p className="font-black text-red-100">
                        Human Trusted Voice decision required
                    </p>

                    <p className="mt-2 text-sm font-semibold leading-6 text-red-100/65">
                        Automatic same-voice revision is
                        disabled. A human must decide how to
                        handle the voice assignment.
                    </p>
                </div>
            )}

            {status === "rejected" && (
                <div className="mt-6 rounded-[22px] border border-red-400/20 bg-red-400/10 p-5">
                    <p className="font-black text-red-100">
                        Curator rejected this Boost
                    </p>
                </div>
            )}

            {isCuratorSafety && (
                <div className="mt-6 rounded-[22px] border border-red-400/20 bg-red-400/10 p-5">
                    <p className="font-black text-red-100">
                        Human safety review required
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

            {status === "editor_approved" &&
                editorVerdict && (
                    <p className="mt-5 text-xs font-bold text-white/35">
                        Voice Editor verdict:{" "}
                        {editorVerdict}
                    </p>
                )}
        </section>
    );
}
