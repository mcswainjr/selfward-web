"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
    createAndReviewJourneyStepFromContentOps,
    importApprovedJourneyStepFromContentOps,
    reviseAndReviewJourneyStepFromContentOps,
    reviewJourneyCoherenceFromContentOps,
} from "./actions";

type PipelineStep = {
    id: string;
    stepNumber: number;
    status: string;
    scriptDraft: string | null;
    editorVerdict: string | null;
    editorNotes: string | null;
    revisionCount: number | null;
};

function describeStatus(status: string) {
    switch (status) {
        case "architected":
            return "Ready for Script Writer";
        case "drafted":
            return "Draft ready for Voice Editor";
        case "editor_approved":
            return "Editor approved";
        case "revision_needed":
            return "Revision needed";
        case "human_safety_review":
            return "Human safety review";
        default:
            return status.replaceAll("_", " ");
    }
}

export default function JourneyCreativePipeline({
    journeyId,
    journeyStatus,
    steps,
}: {
    journeyId: string;
    journeyStatus: string;
    steps: PipelineStep[];
}) {
    const router = useRouter();

    const [isRunning, setIsRunning] =
        useState(false);

    const [progress, setProgress] =
        useState<string | null>(null);

    const [message, setMessage] =
        useState<string | null>(null);

    const [error, setError] =
        useState<string | null>(null);

    const [showApprovedImport, setShowApprovedImport] =
        useState(false);

    const [approvedScript, setApprovedScript] =
        useState("");

    const [isImporting, setIsImporting] =
        useState(false);

    const [
        isReviewingCoherence,
        setIsReviewingCoherence,
    ] = useState(false);

    const [
        isRevising,
        setIsRevising,
    ] = useState(false);

    const sortedSteps = [...steps].sort(
        (a, b) =>
            a.stepNumber - b.stepNumber
    );

    const allApproved =
        sortedSteps.length > 0 &&
        sortedSteps.every(
            (step) =>
                step.status === "editor_approved"
        );

    const hasRevisionNeeded =
        sortedSteps.some(
            (step) =>
                step.status === "revision_needed"
        );

    const hasSafetyReview =
        sortedSteps.some(
            (step) =>
                step.status ===
                "human_safety_review"
        );

    const nextStep =
        sortedSteps.find(
            (step) =>
                step.status === "architected" ||
                step.status === "drafted"
        ) ?? null;

    const revisionStep =
        sortedSteps.find(
            (step) =>
                step.status ===
                "revision_needed"
        ) ?? null;

    async function handleRun() {
        if (
            isRunning ||
            allApproved ||
            !nextStep
        ) {
            return;
        }

        const confirmed = window.confirm(
            `Create and review Day ${nextStep.stepNumber} only? This will run the Script Writer and assigned Trusted Voice Editor for this day. It will update the production Journey, but it will not continue to another day, publish, or release anything.`
        );

        if (!confirmed) {
            return;
        }

        setIsRunning(true);
        setError(null);
        setMessage(null);

        try {
            setProgress(
                `Creating and reviewing Day ${nextStep.stepNumber}...`
            );

            const result =
                await createAndReviewJourneyStepFromContentOps(
                    {
                        journeyId,
                        stepId: nextStep.id,
                    }
                );

            setProgress(null);

            if (
                result.outcome ===
                "revision_needed"
            ) {
                setMessage(
                    `Pipeline paused on Day ${result.stepNumber}: the Voice Editor requested a revision.`
                );

                router.refresh();
                return;
            }

            if (
                result.outcome ===
                "human_safety_review"
            ) {
                setMessage(
                    `Pipeline paused on Day ${result.stepNumber} for human safety review.`
                );

                router.refresh();
                return;
            }

            setMessage(
                `Day ${result.stepNumber} completed Writer and Voice Editor review. Review it before continuing to the next day.`
            );

            router.refresh();
        } catch (err) {
            setProgress(null);

            setError(
                err instanceof Error
                    ? err.message
                    : "The creative pipeline could not finish."
            );

            router.refresh();
        } finally {
            setIsRunning(false);
        }
    }

    async function handleReviseAndReview() {
        if (
            isRunning ||
            isImporting ||
            isReviewingCoherence ||
            isRevising ||
            !revisionStep
        ) {
            return;
        }

        const confirmed =
            window.confirm(
                `Revise and re-review Day ${revisionStep.stepNumber} only? The Writer will revise the rejected draft using the Voice Editor feedback, then the assigned Voice Editor will review that revised Day again. This will not continue to another Day, run coherence review, curate, publish, or release anything.`
            );

        if (!confirmed) {
            return;
        }

        setIsRevising(true);
        setError(null);
        setMessage(null);
        setProgress(
            `Revising and re-reviewing Day ${revisionStep.stepNumber}...`
        );

        try {
            const result =
                await reviseAndReviewJourneyStepFromContentOps(
                    {
                        journeyId,
                        stepId:
                            revisionStep.id,
                    }
                );

            setProgress(null);

            if (
                result.outcome ===
                "approved"
            ) {
                setMessage(
                    `Day ${result.stepNumber} was revised and approved by the Voice Editor. Review the approved script before continuing.`
                );
            } else if (
                result.outcome ===
                "revision_needed"
            ) {
                setMessage(
                    `Day ${result.stepNumber} was revised and re-reviewed, but the Voice Editor requested another revision. Review the new feedback before running another revision.`
                );
            } else if (
                result.outcome ===
                "human_safety_review"
            ) {
                setMessage(
                    `Day ${result.stepNumber} moved to human safety review during the revision loop.`
                );
            }

            router.refresh();
        } catch (err) {
            setProgress(null);

            setError(
                err instanceof Error
                    ? err.message
                    : "The Day revision could not finish."
            );

            router.refresh();
        } finally {
            setIsRevising(false);
        }
    }

    async function handleCoherenceReview() {
        if (
            isRunning ||
            isImporting ||
            isReviewingCoherence ||
            !allApproved ||
            journeyStatus !== "in_production"
        ) {
            return;
        }

        const confirmed = window.confirm(
            "Run the whole-Journey coherence review now? This will review all approved Days together for progression, repetition, continuity, voice consistency, promise, pacing, and safety. It will not curate, human-approve, record, publish, or release the Journey."
        );

        if (!confirmed) {
            return;
        }

        setIsReviewingCoherence(true);
        setError(null);
        setMessage(null);
        setProgress(
            "Reviewing the complete Journey for coherence..."
        );

        try {
            const result =
                await reviewJourneyCoherenceFromContentOps(
                    {
                        journeyId,
                    }
                );

            setProgress(null);

            if (
                result.outcome ===
                "coherence_approved"
            ) {
                setMessage(
                    "Journey coherence approved. No curation, recording approval, or publication was performed."
                );
            } else if (
                result.outcome ===
                "revision_needed"
            ) {
                setMessage(
                    "Coherence review completed and requested revisions. The Journey remains in production."
                );
            } else if (
                result.outcome ===
                "human_safety_review"
            ) {
                setMessage(
                    "Coherence review paused the Journey for human safety review."
                );
            } else {
                setMessage(
                    `Coherence review completed. Current Journey status: ${result.status}.`
                );
            }

            router.refresh();
        } catch (err) {
            setProgress(null);

            setError(
                err instanceof Error
                    ? err.message
                    : "Journey coherence review could not finish."
            );

            router.refresh();
        } finally {
            setIsReviewingCoherence(false);
        }
    }

    async function handleImportApproved() {
        if (
            isRunning ||
            isImporting ||
            !nextStep ||
            nextStep.status !== "architected"
        ) {
            return;
        }

        const cleanScript =
            approvedScript.trim();

        if (!cleanScript) {
            setError(
                "Paste the approved script before importing it."
            );
            return;
        }

        const confirmed = window.confirm(
            `Import this as the approved final script for Day ${nextStep.stepNumber}? This will skip the automated Script Writer and Trusted Voice Editor for this Day. It will not publish or release the Journey.`
        );

        if (!confirmed) {
            return;
        }

        setIsImporting(true);
        setError(null);
        setMessage(null);

        try {
            const result =
                await importApprovedJourneyStepFromContentOps(
                    {
                        journeyId,
                        stepId: nextStep.id,
                        approvedScript: cleanScript,
                    }
                );

            setApprovedScript("");
            setShowApprovedImport(false);

            setMessage(
                `Day ${result.stepNumber} was imported as the approved final script. Review the Day before continuing.`
            );

            router.refresh();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "The approved script could not be imported."
            );

            router.refresh();
        } finally {
            setIsImporting(false);
        }
    }

    return (
        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.05] p-6 sm:p-7">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFB59A]">
                        Creative Pipeline
                    </p>

                    <h2 className="mt-2 text-xl font-black text-white">
                        Scripts & Voice Review
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/45">
                        Create each script from the approved
                        architecture and run it through the
                        assigned Trusted Voice Editor. This does
                        not publish or release the Journey.
                    </p>
                </div>

                <div className="flex shrink-0 flex-col gap-3 sm:items-end">
                    {!allApproved &&
                        !hasRevisionNeeded &&
                        !hasSafetyReview &&
                        nextStep && (
                            <>
                                <button
                                    type="button"
                                    onClick={handleRun}
                                    disabled={
                                        isRunning ||
                                        isImporting ||
                                        showApprovedImport
                                    }
                                    className="rounded-full bg-[#FFB59A] px-5 py-3 text-sm font-black text-[#0B1220] transition hover:bg-[#ffc5af] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isRunning
                                        ? `Creating Day ${nextStep.stepNumber}...`
                                        : `Create & Review Day ${nextStep.stepNumber}`}
                                </button>

                                {nextStep.status ===
                                    "architected" && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setError(null);
                                            setMessage(null);
                                            setShowApprovedImport(
                                                (current) =>
                                                    !current
                                            );
                                        }}
                                        disabled={
                                            isRunning ||
                                            isImporting
                                        }
                                        className="rounded-full border border-white/15 bg-white/[0.05] px-5 py-3 text-sm font-black text-white/70 transition hover:bg-white/[0.09] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {showApprovedImport
                                            ? "Cancel Existing Script"
                                            : `Use Existing Approved Day ${nextStep.stepNumber}`}
                                    </button>
                                )}
                            </>
                        )}

                    {allApproved &&
                        journeyStatus === "in_production" && (
                            <>
                                <div className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-300">
                                    ✓ Voice review complete
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        handleCoherenceReview
                                    }
                                    disabled={
                                        isRunning ||
                                        isImporting ||
                                        isReviewingCoherence
                                    }
                                    className="rounded-full bg-[#FFB59A] px-5 py-3 text-sm font-black text-[#0B1220] transition hover:bg-[#ffc5af] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isReviewingCoherence
                                        ? "Reviewing Journey..."
                                        : "Run Journey Coherence Review"}
                                </button>
                            </>
                        )}

                    {journeyStatus ===
                        "coherence_approved" && (
                        <div className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-300">
                            ✓ Journey coherence approved
                        </div>
                    )}
                </div>
            </div>

            {showApprovedImport &&
                nextStep &&
                nextStep.status === "architected" && (
                    <div className="mt-6 rounded-[22px] border border-[#FFB59A]/20 bg-[#FFB59A]/[0.05] p-5">
                        <p className="text-sm font-black text-white">
                            Existing approved Day {nextStep.stepNumber}
                        </p>

                        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/45">
                            Paste the final human-approved script below.
                            Importing it will mark this Day creatively approved
                            without running the automated Script Writer or
                            Trusted Voice Editor.
                        </p>

                        <textarea
                            value={approvedScript}
                            onChange={(event) =>
                                setApprovedScript(
                                    event.target.value
                                )
                            }
                            disabled={isImporting}
                            placeholder={`Paste the approved Day ${nextStep.stepNumber} script here...`}
                            className="mt-4 min-h-[320px] w-full resize-y rounded-2xl border border-white/10 bg-[#0B1220] p-4 text-sm font-medium leading-7 text-white outline-none transition placeholder:text-white/25 focus:border-[#FFB59A]/40 disabled:opacity-50"
                        />

                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs font-bold leading-5 text-white/35">
                                This does not publish the Journey and cannot
                                overwrite an existing production script.
                            </p>

                            <button
                                type="button"
                                onClick={
                                    handleImportApproved
                                }
                                disabled={
                                    isImporting ||
                                    !approvedScript.trim()
                                }
                                className="shrink-0 rounded-full bg-[#FFB59A] px-5 py-3 text-sm font-black text-[#0B1220] transition hover:bg-[#ffc5af] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isImporting
                                    ? `Importing Day ${nextStep.stepNumber}...`
                                    : `Import Approved Day ${nextStep.stepNumber}`}
                            </button>
                        </div>
                    </div>
                )}

            <div className="mt-6 grid gap-2">
                {sortedSteps.map((step) => {
                    const approved =
                        step.status ===
                        "editor_approved";

                    return (
                        <div
                            key={step.id}
                            className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-black/10 px-4 py-3"
                        >
                            <span className="text-sm font-bold text-white/70">
                                Day {step.stepNumber}
                            </span>

                            <span
                                className={
                                    approved
                                        ? "text-sm font-bold text-emerald-300"
                                        : step.status ===
                                            "revision_needed"
                                          ? "text-sm font-bold text-amber-300"
                                          : step.status ===
                                              "human_safety_review"
                                            ? "text-sm font-bold text-red-300"
                                            : "text-sm font-bold text-white/40"
                                }
                            >
                                {approved
                                    ? "✓ "
                                    : "○ "}
                                {describeStatus(
                                    step.status
                                )}
                            </span>
                        </div>
                    );
                })}
            </div>

            {revisionStep && (
                <div className="mt-6 rounded-[22px] border border-amber-300/20 bg-amber-300/[0.06] p-5">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-200/70">
                        Revision Requested
                    </p>

                    <h3 className="mt-2 text-lg font-black text-white">
                        Day {revisionStep.stepNumber}
                    </h3>

                    <p className="mt-2 text-sm font-semibold leading-6 text-white/55">
                        The Voice Editor reviewed this Day and requested changes before approval.
                        The rejected draft and feedback are preserved below.
                    </p>

                    {typeof revisionStep.revisionCount === "number" && (
                        <p className="mt-3 text-xs font-bold text-white/35">
                            Completed automated revisions: {revisionStep.revisionCount}
                        </p>
                    )}

                    {revisionStep.editorNotes && (
                        <details className="mt-5 rounded-2xl border border-white/10 bg-black/10 p-4">
                            <summary className="cursor-pointer text-sm font-black text-amber-100">
                                Voice Editor feedback
                            </summary>

                            <div className="mt-4 whitespace-pre-wrap text-sm font-semibold leading-7 text-white/65">
                                {revisionStep.editorNotes}
                            </div>
                        </details>
                    )}

                    {revisionStep.scriptDraft && (
                        <details className="mt-3 rounded-2xl border border-white/10 bg-black/10 p-4">
                            <summary className="cursor-pointer text-sm font-black text-white/70">
                                Rejected draft
                            </summary>

                            <div className="mt-4 whitespace-pre-wrap text-sm font-semibold leading-7 text-white/60">
                                {revisionStep.scriptDraft}
                            </div>
                        </details>
                    )}

                    <button
                        type="button"
                        onClick={
                            handleReviseAndReview
                        }
                        disabled={
                            isRunning ||
                            isImporting ||
                            isReviewingCoherence ||
                            isRevising
                        }
                        className="mt-5 inline-flex rounded-full bg-amber-300 px-5 py-3 text-sm font-black text-[#0B1220] transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isRevising
                            ? `Revising Day ${revisionStep.stepNumber}...`
                            : `Revise & Re-review Day ${revisionStep.stepNumber}`}
                    </button>
                </div>
            )}

            {progress && (
                <div className="mt-5 rounded-2xl border border-[#FFB59A]/20 bg-[#FFB59A]/[0.07] px-4 py-3 text-sm font-bold text-[#FFCFBC]">
                    {progress}
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
