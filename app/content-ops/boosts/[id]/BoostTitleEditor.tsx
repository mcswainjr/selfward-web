"use client";

import {
    useEffect,
    useState,
    useTransition,
} from "react";
import { useRouter } from "next/navigation";

import {
    updateBoostTitleFromContentOps,
} from "./actions";

type BoostTitleEditorProps = {
    boostId: string;
    workingTitle: string;
    editable: boolean;
};

export default function BoostTitleEditor({
    boostId,
    workingTitle,
    editable,
}: BoostTitleEditorProps) {
    const router = useRouter();

    const [isEditing, setIsEditing] =
        useState(false);

    const [title, setTitle] =
        useState(workingTitle);

    const [error, setError] =
        useState<string | null>(null);

    const [isPending, startTransition] =
        useTransition();

    useEffect(() => {
        if (!isEditing) {
            setTitle(workingTitle);
        }
    }, [workingTitle, isEditing]);

    function cancelEditing() {
        setTitle(workingTitle);
        setError(null);
        setIsEditing(false);
    }

    function saveTitle() {
        const normalizedTitle = title
            .trim()
            .replace(/\s+/g, " ");

        if (normalizedTitle === workingTitle) {
            cancelEditing();
            return;
        }

        setError(null);

        startTransition(async () => {
            try {
                const result =
                    await updateBoostTitleFromContentOps({
                        boostId,
                        workingTitle: normalizedTitle,
                    });

                setTitle(result.workingTitle);
                setIsEditing(false);
                router.refresh();
            } catch (saveError) {
                setError(
                    saveError instanceof Error
                        ? saveError.message
                        : "Unable to save the Boost title."
                );
            }
        });
    }

    if (isEditing) {
        return (
            <div className="mt-3">
                <input
                    type="text"
                    value={title}
                    onChange={(event) =>
                        setTitle(event.target.value)
                    }
                    maxLength={120}
                    disabled={isPending}
                    autoFocus
                    className="w-full max-w-4xl rounded-2xl border border-white/15 bg-[#0F1A2E] px-4 py-3 text-2xl font-black tracking-[-0.03em] text-white outline-none transition focus:border-[#FFB59A]/70 sm:text-3xl"
                />

                <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={saveTitle}
                        disabled={
                            isPending ||
                            title.trim().length < 3
                        }
                        className="rounded-full bg-[#FFB59A] px-4 py-2 text-sm font-black text-[#09111F] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {isPending
                            ? "Saving..."
                            : "Save Title"}
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
        <div className="mt-3">
            <div className="flex flex-wrap items-start gap-3">
                <h1 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                    {workingTitle}
                </h1>

                {editable ? (
                    <button
                        type="button"
                        onClick={() => {
                            setError(null);
                            setIsEditing(true);
                        }}
                        className="mt-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-white/55 transition hover:border-white/20 hover:text-white"
                    >
                        Edit Title
                    </button>
                ) : null}
            </div>

            {!editable ? (
                <p className="mt-2 text-xs font-semibold text-white/35">
                    Title locked after playable content
                    is created.
                </p>
            ) : null}
        </div>
    );
}
