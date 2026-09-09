"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { startProductionJourneyFromContentOps } from "../actions";

export default function NewJourneyForm() {
    const router = useRouter();

    const [intendedListenerMoment, setIntendedListenerMoment] =
        useState("");

    const [architectBrief, setArchitectBrief] =
        useState("");

    const [confirmed, setConfirmed] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const [isPending, startTransition] =
        useTransition();

    function handleSubmit() {
        setError(null);

        if (!intendedListenerMoment.trim()) {
            setError(
                "Add the intended listener moment before starting production."
            );
            return;
        }

        if (!architectBrief.trim()) {
            setError(
                "Paste the approved Content Architect brief before starting production."
            );
            return;
        }

        if (!confirmed) {
            setError(
                "Confirm that you want this Journey to enter the production pipeline."
            );
            return;
        }

        startTransition(async () => {
            try {
                const result =
                    await startProductionJourneyFromContentOps({
                        intendedListenerMoment,
                        architectBrief,
                    });

                if (result.journeyId) {
                    router.push(
                        `/content-ops/journeys/${result.journeyId}`
                    );
                    router.refresh();
                    return;
                }

                router.push("/content-ops");
                router.refresh();
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to start this Journey."
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
                        Listener moment
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                        Describe the moment this Journey is for. This is the
                        core human situation the production pipeline should
                        understand.
                    </p>
                </div>

                <textarea
                    value={intendedListenerMoment}
                    onChange={(event) =>
                        setIntendedListenerMoment(
                            event.target.value
                        )
                    }
                    rows={6}
                    placeholder="Example: The listener feels like life has become mostly maintenance—work, obligations, errands, scrolling, and being fine—but wonders where their real aliveness went."
                    className="w-full resize-y rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-orange-300/40"
                />
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
                <div className="mb-6">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-200">
                        Step 2
                    </p>

                    <h2 className="mt-2 text-xl font-bold text-white">
                        Approved Architect brief
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                        Paste the complete Journey Architecture from the
                        Selfward Content Architect. Its approved title,
                        narrator, length, arc, and step direction will be sent
                        into the production pipeline.
                    </p>
                </div>

                <textarea
                    value={architectBrief}
                    onChange={(event) =>
                        setArchitectBrief(
                            event.target.value
                        )
                    }
                    rows={22}
                    placeholder="Paste the complete Content Architect output here..."
                    className="w-full resize-y rounded-2xl border border-white/10 bg-black/20 px-4 py-4 font-mono text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-orange-300/40"
                />
            </section>

            <section className="rounded-3xl border border-orange-300/15 bg-orange-300/[0.06] p-6">
                <label className="flex cursor-pointer items-start gap-3">
                    <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(event) =>
                            setConfirmed(
                                event.target.checked
                            )
                        }
                        disabled={isPending}
                        className="mt-1 h-4 w-4"
                    />

                    <span>
                        <span className="block font-bold text-white">
                            This architecture is ready to enter production.
                        </span>

                        <span className="mt-1 block text-sm leading-6 text-white/55">
                            Starting it will create a real production Journey
                            in Supabase. It will not publish or release the
                            Journey.
                        </span>
                    </span>
                </label>
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
                    disabled={isPending}
                    className="rounded-full bg-orange-300 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-orange-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isPending
                        ? "Starting Journey..."
                        : "Start Production Journey"}
                </button>
            </div>
        </div>
    );
}
