"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBoostArchitectureFromContentOps } from "./actions";

type MindsetFeeling = {
    id: string;
    name: string;
    slug: string;
    category_slug: string;
};

type BoostFormat =
    | "affirmation"
    | "story"
    | "meditation";

const formatOptions: Array<{
    value: BoostFormat;
    label: string;
    description: string;
}> = [
    {
        value: "affirmation",
        label: "Affirmation",
        description:
            "Brief, direct support for a specific inner moment.",
    },
    {
        value: "story",
        label: "Story",
        description:
            "Narrative, metaphor, or perspective-led reflection.",
    },
    {
        value: "meditation",
        label: "Meditation",
        description:
            "A slower guided experience with room to settle in.",
    },
];

function categoryLabel(value: string) {
    return value
        .replaceAll("-", " ")
        .replace(/\b\w/g, (letter) =>
            letter.toUpperCase()
        );
}

export default function NewBoostForm({
    feelings,
}: {
    feelings: MindsetFeeling[];
}) {
    const router = useRouter();

    const [
        mindsetFeelingSlug,
        setMindsetFeelingSlug,
    ] = useState("");

    const [
        boostFormat,
        setBoostFormat,
    ] = useState<BoostFormat>("affirmation");

    const [
        creativeDirection,
        setCreativeDirection,
    ] = useState("");

    const [
        error,
        setError,
    ] = useState<string | null>(null);

    const [
        isPending,
        startTransition,
    ] = useTransition();

    const groupedFeelings = feelings.reduce<
        Record<string, MindsetFeeling[]>
    >((groups, feeling) => {
        const category =
            feeling.category_slug || "other";

        groups[category] ??= [];
        groups[category].push(feeling);

        return groups;
    }, {});

    function handleSubmit() {
        setError(null);

        if (!mindsetFeelingSlug) {
            setError(
                "Choose the mindset feeling this Boost should support."
            );
            return;
        }

        startTransition(async () => {
            try {
                const result =
                    await createBoostArchitectureFromContentOps({
                        mindsetFeelingSlug,
                        boostFormat,
                        creativeDirection,
                    });

                router.push(
                    `/content-ops/boosts/${result.boostId}`
                );

                router.refresh();
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to create this Boost."
                );
            }
        });
    }

    return (
        <div className="space-y-8">
            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
                <div className="mb-6">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-200">
                        Step 1
                    </p>

                    <h2 className="mt-2 text-xl font-bold text-white">
                        Mindset Feeling
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                        Choose where this Boost belongs in the
                        listener experience. The Architect will
                        not be allowed to change this selection.
                    </p>
                </div>

                <select
                    value={mindsetFeelingSlug}
                    onChange={(event) =>
                        setMindsetFeelingSlug(
                            event.target.value
                        )
                    }
                    disabled={isPending}
                    className="w-full rounded-2xl border border-white/10 bg-[#0B1220] px-4 py-4 text-sm font-semibold text-white outline-none focus:border-orange-300/40"
                >
                    <option value="">
                        Choose a mindset feeling...
                    </option>

                    {Object.entries(groupedFeelings)
                        .sort(([a], [b]) =>
                            a.localeCompare(b)
                        )
                        .map(
                            ([
                                category,
                                categoryFeelings,
                            ]) => (
                                <optgroup
                                    key={category}
                                    label={categoryLabel(
                                        category
                                    )}
                                >
                                    {categoryFeelings.map(
                                        (feeling) => (
                                            <option
                                                key={
                                                    feeling.id
                                                }
                                                value={
                                                    feeling.slug
                                                }
                                            >
                                                {
                                                    feeling.name
                                                }
                                            </option>
                                        )
                                    )}
                                </optgroup>
                            )
                        )}
                </select>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
                <div className="mb-6">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-200">
                        Step 2
                    </p>

                    <h2 className="mt-2 text-xl font-bold text-white">
                        Boost Format
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                        Choose the content form before the
                        Architect begins. This is a production
                        constraint, not a suggestion.
                    </p>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    {formatOptions.map((option) => {
                        const selected =
                            boostFormat ===
                            option.value;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                disabled={isPending}
                                onClick={() =>
                                    setBoostFormat(
                                        option.value
                                    )
                                }
                                className={`rounded-2xl border p-5 text-left transition ${
                                    selected
                                        ? "border-orange-300/50 bg-orange-300/[0.10]"
                                        : "border-white/10 bg-black/20 hover:border-white/20"
                                }`}
                            >
                                <span className="block font-black text-white">
                                    {option.label}
                                </span>

                                <span className="mt-2 block text-sm leading-6 text-white/50">
                                    {
                                        option.description
                                    }
                                </span>
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
                <div className="mb-6">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-200">
                        Step 3 · Optional
                    </p>

                    <h2 className="mt-2 text-xl font-bold text-white">
                        Creative Direction
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                        Add a particular listener moment,
                        tension, angle, or context if you have
                        one in mind. Leave this blank when you
                        want the Architect to find the strongest
                        direction within the selected feeling.
                    </p>
                </div>

                <textarea
                    value={creativeDirection}
                    onChange={(event) =>
                        setCreativeDirection(
                            event.target.value
                        )
                    }
                    rows={7}
                    maxLength={3000}
                    disabled={isPending}
                    placeholder="Example: They are good at several different things and are beginning to interpret that range as evidence that they lack a real direction."
                    className="w-full resize-y rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-orange-300/40"
                />

                <p className="mt-2 text-right text-xs font-semibold text-white/30">
                    {creativeDirection.length}/3000
                </p>
            </section>

            <section className="rounded-3xl border border-orange-300/15 bg-orange-300/[0.06] p-6">
                <p className="font-bold text-white">
                    This starts creative production only.
                </p>

                <p className="mt-2 text-sm leading-6 text-white/55">
                    The Architect will create a real Boost
                    architecture in Supabase using the mindset
                    feeling and format you selected. It will not
                    write the script, create audio, or release
                    anything to listeners.
                </p>
            </section>

            {error && (
                <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm font-semibold text-red-200">
                    {error}
                </div>
            )}

            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={
                        isPending ||
                        !mindsetFeelingSlug
                    }
                    className="rounded-full bg-orange-300 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-orange-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isPending
                        ? "Creating Architecture..."
                        : "Create Boost Architecture"}
                </button>
            </div>
        </div>
    );
}
