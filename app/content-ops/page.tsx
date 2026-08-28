import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "../../lib/supabase/admin";
import { createClient } from "../../lib/supabase/server";

type JourneyAction = {
    journey_id: string;
    title: string;
    trusted_voice: string | null;
    planned_days: number;
    founder_stage: string;
    scripts_ready: boolean;
    recording_scripts_ready: boolean;
    audio_ready: boolean;
    cover_ready: boolean;
    hero_ready: boolean;
    ready_for_release: boolean;
    next_action: string;
    data_check: string;
    updated_at: string;
};

function ChecklistItem({
    label,
    ready,
}: {
    label: string;
    ready: boolean;
}) {
    return (
        <div className="flex items-center gap-2 text-sm font-bold">
            <span
                className={
                    ready
                        ? "text-emerald-400"
                        : "text-white/30"
                }
            >
                {ready ? "✓" : "○"}
            </span>

            <span className={ready ? "text-white/75" : "text-white/45"}>
                {label}
            </span>
        </div>
    );
}

function stageStyles(stage: string) {
    switch (stage) {
        case "Needs My Review":
            return "border-amber-400/20 bg-amber-400/10 text-amber-200";

        case "Needs Production":
            return "border-orange-400/20 bg-orange-400/10 text-orange-200";

        case "Ready for Release":
            return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";

        case "Creating":
            return "border-sky-400/20 bg-sky-400/10 text-sky-200";

        case "Needs Legacy Setup":
            return "border-violet-400/20 bg-violet-400/10 text-violet-200";

        default:
            return "border-white/10 bg-white/5 text-white/60";
    }
}

export default async function ContentOpsPage() {
    /*
      First gate:
      verify the visitor's actual Supabase session.
    */
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/content-ops/login");
    }

    /*
      Second gate:
      only the designated Content Ops admin can proceed.
    */
    const adminEmail = process.env.CONTENT_OPS_ADMIN_EMAIL
        ?.trim()
        .toLowerCase();

    if (!adminEmail) {
        throw new Error("CONTENT_OPS_ADMIN_EMAIL is not configured.");
    }

    const userEmail = user.email?.trim().toLowerCase();

    if (userEmail !== adminEmail) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#0B1220] px-6 text-white">
                <div className="max-w-lg text-center">
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-[#FFB59A]">
                        Selfward
                    </p>

                    <h1 className="text-3xl font-black">Access denied</h1>

                    <p className="mt-4 font-semibold leading-7 text-white/60">
                        This account does not have permission to access Content Ops.
                    </p>
                </div>
            </main>
        );
    }

    /*
      Only after both security checks pass do we use the
      server-only admin client to read the private founder view.
    */
    const admin = createAdminClient();

    const { data, error } = await admin
        .from("v_founder_journey_actions")
        .select(
            `
        journey_id,
        title,
        trusted_voice,
        planned_days,
        founder_stage,
        scripts_ready,
        recording_scripts_ready,
        audio_ready,
        cover_ready,
        hero_ready,
        ready_for_release,
        next_action,
        data_check,
        updated_at
      `
        );

    if (error) {
        console.error("Content Ops Journey queue error:", error);

        return (
            <main className="min-h-screen bg-[#0B1220] px-6 py-12 text-white">
                <section className="mx-auto w-full max-w-6xl">
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-[#FFB59A]">
                        Selfward
                    </p>

                    <h1 className="text-4xl font-black tracking-[-0.04em]">
                        Content Ops
                    </h1>

                    <div className="mt-8 rounded-[28px] border border-red-400/20 bg-red-400/10 p-7">
                        <p className="font-bold text-red-100">
                            The Journey queue could not be loaded.
                        </p>
                    </div>
                </section>
            </main>
        );
    }

    const journeys = (data ?? []) as JourneyAction[];

    const stageOrder: Record<string, number> = {
        "Needs My Review": 1,
        "Needs Production": 2,
        "Needs Legacy Setup": 3,
        "Ready for Release": 4,
        Creating: 5,
    };

    journeys.sort((a, b) => {
        const stageDifference =
            (stageOrder[a.founder_stage] ?? 99) -
            (stageOrder[b.founder_stage] ?? 99);

        if (stageDifference !== 0) {
            return stageDifference;
        }

        return a.title.localeCompare(b.title);
    });

    const groupedJourneys = journeys.reduce<Record<string, JourneyAction[]>>(
        (groups, journey) => {
            if (!groups[journey.founder_stage]) {
                groups[journey.founder_stage] = [];
            }

            groups[journey.founder_stage].push(journey);
            return groups;
        },
        {}
    );

    const stages = [
        "Needs My Review",
        "Needs Production",
        "Needs Legacy Setup",
        "Ready for Release",
        "Creating",
    ];

    return (
        <main className="min-h-screen bg-[#0B1220] px-6 py-10 text-white sm:px-8">
            <section className="mx-auto w-full max-w-6xl">
                <header className="border-b border-white/10 pb-8">
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-[#FFB59A]">
                        Selfward
                    </p>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                                Content Ops
                            </h1>

                            <p className="mt-3 font-semibold text-white/50">
                                What needs your attention.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                href="/content-ops/boosts"
                                className="inline-flex rounded-full border border-[#FFB59A]/30 bg-[#FFB59A]/10 px-5 py-2.5 text-sm font-black uppercase tracking-[0.18em] text-[#FFB59A] transition hover:bg-[#FFB59A]/15"
                            >
                                Open Boost Dashboard
                            </Link>

                            <Link
                                href="/content-ops/new-journey"
                                className="rounded-full bg-[#FFB59A] px-5 py-2.5 text-sm font-black text-[#0B1220] transition hover:bg-[#ffc5af]"
                            >
                                + Start New Journey
                            </Link>

                            <div className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-bold text-white/50">
                                {journeys.length}{" "}
                                {journeys.length === 1 ? "Journey" : "Journeys"} in queue
                            </div>
                        </div>
                    </div>
                </header>

                {journeys.length === 0 ? (
                    <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.055] p-8">
                        <h2 className="text-xl font-black">Nothing needs you right now.</h2>

                        <p className="mt-2 font-semibold text-white/50">
                            Your Journey production queue is clear.
                        </p>
                    </div>
                ) : (
                    <div className="mt-10 space-y-12">
                        {stages.map((stage) => {
                            const stageJourneys = groupedJourneys[stage];

                            if (!stageJourneys?.length) {
                                return null;
                            }

                            return (
                                <section key={stage}>
                                    <div className="mb-5 flex items-center gap-3">
                                        <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white/65">
                                            {stage}
                                        </h2>

                                        <span className="rounded-full bg-white/[0.07] px-2.5 py-1 text-xs font-black text-white/45">
                                            {stageJourneys.length}
                                        </span>
                                    </div>

                                    <div className="grid gap-5">
                                        {stageJourneys.map((journey) => (
                                            <article
                                                key={journey.journey_id}
                                                className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6 shadow-xl shadow-black/10 sm:p-7"
                                            >
                                                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                                    <div className="min-w-0">
                                                        <span
                                                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${stageStyles(
                                                                journey.founder_stage
                                                            )}`}
                                                        >
                                                            {journey.founder_stage}
                                                        </span>

                                                        <h3 className="mt-4 text-2xl font-black tracking-[-0.03em]">
                                                            {journey.title}
                                                        </h3>

                                                        <p className="mt-2 text-sm font-bold text-white/45">
                                                            {journey.trusted_voice ?? "Voice not assigned"} ·{" "}
                                                            {journey.planned_days}{" "}
                                                            {journey.planned_days === 1 ? "day" : "days"}
                                                        </p>
                                                    </div>

                                                    <div className="grid min-w-[220px] gap-2 rounded-2xl border border-white/[0.07] bg-black/10 p-4">
                                                        <ChecklistItem
                                                            label="Scripts"
                                                            ready={journey.scripts_ready}
                                                        />

                                                        <ChecklistItem
                                                            label="Recording scripts"
                                                            ready={journey.recording_scripts_ready}
                                                        />

                                                        <ChecklistItem
                                                            label="Audio"
                                                            ready={journey.audio_ready}
                                                        />

                                                        <ChecklistItem
                                                            label="Cover"
                                                            ready={journey.cover_ready}
                                                        />

                                                        <ChecklistItem
                                                            label="Hero"
                                                            ready={journey.hero_ready}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="mt-6 border-t border-white/[0.07] pt-5">
                                                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#FFB59A]">
                                                        Next
                                                    </p>

                                                    <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                                        <p className="text-base font-black text-white/85">
                                                            {journey.next_action}
                                                        </p>

                                                        <Link
                                                            href={`/content-ops/journeys/${journey.journey_id}`}
                                                            className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/[0.07] px-5 py-2.5 text-sm font-black text-white transition hover:bg-white/[0.12]"
                                                        >
                                                            Open Journey →
                                                        </Link>
                                                    </div>

                                                    {journey.data_check !== "OK" && (
                                                        <p className="mt-3 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm font-bold text-red-100">
                                                            Data check: {journey.data_check}
                                                        </p>
                                                    )}
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
}