"use client";

import {
    useEffect,
    useState,
    useTransition,
} from "react";
import { useRouter } from "next/navigation";

import {
    updateBoostFinalScriptFromContentOps,
} from "./actions";

type Props = {
    boostId: string;
    finalScript: string;
    editable: boolean;
};

export default function BoostFinalScriptEditor({
    boostId,
    finalScript,
    editable,
}: Props) {
    const router = useRouter();

    const [isEditing, setIsEditing] =
        useState(false);

    const [script, setScript] =
        useState(finalScript);

    const [error, setError] =
        useState<string | null>(null);

    const [isPending, startTransition] =
        useTransition();

    useEffect(() => {
        if (!isEditing) {
            setScript(finalScript);
        }
    }, [finalScript, isEditing]);

    function cancelEditing() {
        setScript(finalScript);
        setError(null);
        setIsEditing(false);
    }

    function saveScript() {
        const normalizedScript = script.trim();

        setError(null);

        startTransition(async () => {
            try {
                const result =
                    await updateBoostFinalScriptFromContentOps({
                        boostId,
                        finalScript: normalizedScript,
                    });

                setScript(result.finalScript);
                setIsEditing(false);
                router.refresh();
            } catch (saveError) {
                setError(
                    saveError instanceof Error
                        ? saveError.message
                        : "Unable to save the final Boost script."
                );
            }
        });
    }

    if (isEditing) {
        return (
            <div className="rounded-[24px] border border-[#FFB59A]/30 bg-white/[0.04] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFB59A]">
                        Human Final Script
                    </p>

                    <p className="text-xs font-semibold text-white/35">
                        {script.length} / 12000
                    </p>
                </div>

                <textarea
                    value={script}
                    onChange={(event) =>
                        setScript(event.target.value)
                    }
                    maxLength={12000}
                    disabled={isPending}
                    autoFocus
                    rows={10}
                    className="mt-4 w-full resize-y rounded-2xl border border-white/15 bg-[#0F1A2E] px-4 py-4 text-[15px] font-semibold leading-8 text-white outline-none transition focus:border-[#FFB59A]/70"
                />

                <p className="mt-3 text-sm font-semibold leading-6 text-white/40">
                    Saving changed wording does not preserve the
                    current Voice Editor approval. The last
                    Voice-Editor-approved script remains as history,
                    and your new exact words move into Recording
                    Rewrite review before Curator.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={saveScript}
                        disabled={
                            isPending ||
                            !script.trim()
                        }
                        className="rounded-full bg-[#FFB59A] px-4 py-2 text-sm font-black text-[#09111F] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {isPending
                            ? "Saving..."
                            : "Save & Require Voice Re-Review"}
                    </button>

                    <button
                        type="button"
                        onClick={cancelEditing}
                        disabled={isPending}
                        className="rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-white/60 transition hover:border-white/30 hover:text-white disabled:opacity-40"
                    >
                        Cancel
                    </button>
                </div>

                {error ? (
                    <p className="mt-3 text-sm font-semibold text-red-300">
                        {error}
                    </p>
                ) : null}
            </div>
        );
    }

    return (
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
                    Final Approved Script
                </p>

                {editable ? (
                    <button
                        type="button"
                        onClick={() => {
                            setError(null);
                            setIsEditing(true);
                        }}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-white/55 transition hover:border-white/20 hover:text-white"
                    >
                        Edit Final Script
                    </button>
                ) : null}
            </div>

            <div className="mt-4 whitespace-pre-wrap text-[15px] font-semibold leading-8 text-white/70">
                {finalScript}
            </div>

            {!editable ? (
                <p className="mt-4 text-xs font-semibold text-white/30">
                    Human final-script editing is locked after
                    Curator review begins.
                </p>
            ) : null}
        </div>
    );
}
