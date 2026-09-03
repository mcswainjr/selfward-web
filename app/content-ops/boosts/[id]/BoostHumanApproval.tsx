"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
    approveBoostForRecordingFromContentOps,
} from "./actions";

type Props = {
    boostId: string;
    status: string;
    curatorAction: string | null;
    curatorScore: number | null;
    contentId: string | null;
};

export default function BoostHumanApproval({
    boostId,
    status,
    curatorAction,
    curatorScore,
    contentId,
}: Props) {
    const router = useRouter();

    const [isApproving, setIsApproving] =
        useState(false);

    const [message, setMessage] =
        useState<string | null>(null);

    const [error, setError] =
        useState<string | null>(null);

    const waitingForApproval =
        status === "pending_human_approval";

    const humanApproved =
        status === "human_approved";

    if (!waitingForApproval && !humanApproved) {
        return null;
    }

    const approvedByCurator =
        curatorAction ===
        "APPROVE FOR RECORDING";

    const needsMicroEdits =
        curatorAction ===
        "APPROVE AFTER MICRO-EDITS";

    const canApprove =
        waitingForApproval &&
        approvedByCurator &&
        !contentId;

    async function handleApprove() {
        if (!canApprove || isApproving) {
            return;
        }

        const confirmed = window.confirm(
            "Approve this Boost for recording? This records your explicit human approval and moves the Boost to human_approved. It will not create playable content, upload audio, publish, or release anything."
        );

        if (!confirmed) return;

        setIsApproving(true);
        setMessage(null);
        setError(null);

        try {
            const result =
                await approveBoostForRecordingFromContentOps({
                    boostId,
                });

            if (
                result.outcome ===
                "human_approved"
            ) {
                setMessage(
                    "Human recording approval is complete. Media production remains a separate next stage."
                );
            }

            router.refresh();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Human recording approval could not be completed."
            );

            router.refresh();
        } finally {
            setIsApproving(false);
        }
    }

    return (
        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFB59A]">
                        Human Approval
                    </p>

                    <h2 className="mt-2 text-xl font-black">
                        {humanApproved
                            ? "Approved for recording"
                            : needsMicroEdits
                              ? "Micro-edits required first"
                              : "Ready for your decision"}
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/45">
                        Human approval authorizes this
                        final Boost script for recording.
                        Audio creation, playable content,
                        publication, and release remain
                        separate production stages.
                    </p>
                </div>

                {canApprove && (
                    <button
                        type="button"
                        onClick={handleApprove}
                        disabled={isApproving}
                        className="shrink-0 rounded-full bg-[#FFB59A] px-5 py-3 text-sm font-black text-[#0B1220] transition hover:bg-[#ffc5af] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isApproving
                            ? "Approving..."
                            : "Approve for Recording"}
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

            {needsMicroEdits && (
                <div className="mt-6 rounded-[22px] border border-amber-300/25 bg-amber-300/[0.07] p-5">
                    <p className="font-black text-amber-200">
                        Human approval is intentionally blocked
                    </p>

                    <p className="mt-2 text-sm font-semibold leading-6 text-white/55">
                        Curator requested micro-edits before
                        recording. We will build that explicit
                        edit checkpoint rather than bypassing
                        it with human approval.
                    </p>
                </div>
            )}

            {humanApproved && (
                <div className="mt-6 rounded-[22px] border border-emerald-400/25 bg-emerald-400/[0.08] p-5">
                    <p className="font-black text-emerald-200">
                        Human approval complete
                    </p>

                    <p className="mt-2 text-sm font-semibold leading-6 text-emerald-100/65">
                        This Boost is approved for recording.
                        Nothing in media production has been
                        started automatically.
                    </p>
                </div>
            )}

            {waitingForApproval &&
                !approvedByCurator &&
                !needsMicroEdits && (
                    <div className="mt-6 rounded-[22px] border border-red-400/20 bg-red-400/10 p-5">
                        <p className="font-black text-red-100">
                            Approval unavailable
                        </p>

                        <p className="mt-2 text-sm font-semibold leading-6 text-red-100/65">
                            The stored Curator action is not
                            eligible for this human approval
                            control.
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
