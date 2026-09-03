import Link from "next/link";
import { redirect } from "next/navigation";

import { createAdminClient } from "../../../lib/supabase/admin";
import { createClient } from "../../../lib/supabase/server";

type PlaybackRow = {
    category_name: string | null;
    mindset_feeling_name: string | null;
    mindset_feeling_slug: string | null;
    experience_type: string | null;
    selection_match_reason: string | null;
    content_id: string | null;
    title: string | null;
    content_type: string | null;
    trusted_voice_name: string | null;
    duration_seconds: number | null;
    priority: number | null;
    playback_status: string | null;
};

type GapRow = {
    category_name: string | null;
    mindset_feeling_name: string | null;
    mindset_feeling_slug: string | null;
    experience_type: string | null;
    recommended_action: string | null;
    recommended_content_type: string | null;
    current_fallback_title: string | null;
    current_fallback_voice: string | null;
    current_fallback_duration: number | null;
};

type RecipeRow = {
    state_of_mind_category_name: string | null;
    mindset_feeling_name: string | null;
    mindset_feeling_slug: string | null;
    planned_content_type: string | null;
    trusted_voice_name: string | null;
    title_seed: string | null;
    emotional_job: string | null;
    generation_recipe_id: string | null;
};

type QueueRow = {
    content_id: string | null;
    title: string | null;
    content_type: string | null;
    trusted_voice_name: string | null;
    mindset_feeling_name: string | null;
    production_status: string | null;
    editor_status: string | null;
    is_active: boolean | null;
    duration_seconds: number | null;
    admin_queue_status: string | null;
};

type CreativeBoostRow = {
    id: string;
    working_title: string;
    boost_format: string | null;
    trusted_voice: string | null;
    status: string;
    content_id: string | null;
    voice_score: number | null;
    curator_score: number | null;
    created_at: string;
};

const experienceLabels: Record<string, string> = {
    daily_boost: "Daily Boost",
    steady_growth: "Steady Growth",
    breakthrough_session: "Breakthrough Session",
};

const experienceOrder = [
    "daily_boost",
    "steady_growth",
    "breakthrough_session",
];

function statusStyles(status: string | null, matchReason?: string | null) {
    const value = status ?? matchReason ?? "";

    if (value === "exact" || value === "exact_feeling") {
        return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
    }

    if (value === "acceptable_fallback_review" || value === "same_category_same_valence_fallback") {
        return "border-amber-400/20 bg-amber-400/10 text-amber-100";
    }

    if (value === "needs_editorial_review" || value === "same_category_fallback") {
        return "border-orange-400/20 bg-orange-400/10 text-orange-100";
    }

    if (value === "missing") {
        return "border-red-400/20 bg-red-400/10 text-red-100";
    }

    return "border-white/10 bg-white/5 text-white/70";
}

function Pill({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${className}`}>
            {children}
        </span>
    );
}

function StatCard({
    label,
    value,
}: {
    label: string;
    value: number | string;
}) {
    return (
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">
                {label}
            </p>
            <p className="mt-3 text-3xl font-black text-white">{value}</p>
        </div>
    );
}

function formatDuration(seconds: number | null) {
    if (!seconds && seconds !== 0) return "—";
    if (seconds < 60) return `${seconds}s`;

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs ? `${mins}m ${secs}s` : `${mins}m`;
}

function normalizeFilter(value: string | string[] | undefined) {
    if (Array.isArray(value)) return value[0] ?? "all";
    return value ?? "all";
}

function buildFilterHref(filters: {
    experience?: string;
    category?: string;
    action?: string;
}) {
    const params = new URLSearchParams();

    if (filters.experience && filters.experience !== "all") {
        params.set("experience", filters.experience);
    }

    if (filters.category && filters.category !== "all") {
        params.set("category", filters.category);
    }

    if (filters.action && filters.action !== "all") {
        params.set("action", filters.action);
    }

    const query = params.toString();
    return query ? `/content-ops/boosts?${query}` : "/content-ops/boosts";
}

async function requireContentOpsAdmin() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/content-ops/login");
    }

    const adminEmail = process.env.CONTENT_OPS_ADMIN_EMAIL
        ?.trim()
        .toLowerCase();

    const userEmail = user.email?.trim().toLowerCase();

    if (!adminEmail) {
        throw new Error("CONTENT_OPS_ADMIN_EMAIL is not configured.");
    }

    if (userEmail !== adminEmail) {
        return null;
    }

    return createAdminClient();
}

export default async function BoostAdminPage({
    searchParams,
}: {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
    const admin = await requireContentOpsAdmin();

    if (!admin) {
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

    const params = (await searchParams) ?? {};
    const experienceFilter = normalizeFilter(params.experience);
    const categoryFilter = normalizeFilter(params.category);
    const actionFilter = normalizeFilter(params.action);

    const [
        playbackResult,
        gapResult,
        recipeResult,
        queueResult,
        creativeResult,
    ] = await Promise.all([
        admin.from("admin_boost_playback_map_view").select("*"),
        admin.from("admin_boost_generation_gap_queue_view").select("*"),
        admin.from("admin_boost_recipe_coverage_view").select("*"),
        admin.from("admin_boost_queue_view").select("*"),
        admin
            .from("boosts")
            .select(
                "id, working_title, boost_format, trusted_voice, status, content_id, voice_score, curator_score, created_at"
            )
            .order("created_at", { ascending: false }),
    ]);

    const firstError =
        playbackResult.error ??
        gapResult.error ??
        recipeResult.error ??
        queueResult.error ??
        creativeResult.error;

    if (firstError) {
        console.error("Boost Admin Dashboard error:", firstError);

        return (
            <main className="min-h-screen bg-[#0B1220] px-6 py-12 text-white">
                <section className="mx-auto w-full max-w-7xl">
                    <Link
                        href="/content-ops"
                        className="text-sm font-bold text-white/50 hover:text-white"
                    >
                        ← Back to Content Ops
                    </Link>

                    <div className="mt-8 rounded-[28px] border border-red-400/20 bg-red-400/10 p-7">
                        <p className="font-bold text-red-100">
                            The Boost dashboard could not be loaded.
                        </p>
                        <p className="mt-3 text-sm font-semibold text-red-100/70">
                            {firstError.message}
                        </p>
                    </div>
                </section>
            </main>
        );
    }

    const playbackRows = (playbackResult.data ?? []) as PlaybackRow[];
    const gapRows = (gapResult.data ?? []) as GapRow[];
    const recipeRows = (recipeResult.data ?? []) as RecipeRow[];
    const queueRows = (queueResult.data ?? []) as QueueRow[];
    const creativeRows = (creativeResult.data ?? []) as CreativeBoostRow[];

    const uniqueFeelings = new Set(
        playbackRows
            .map((row) => row.mindset_feeling_slug)
            .filter(Boolean)
    );

    const exactMatches = playbackRows.filter(
        (row) =>
            row.selection_match_reason === "exact_feeling" ||
            row.playback_status === "exact"
    ).length;

    const fallbacks = playbackRows.filter(
        (row) =>
            row.content_id &&
            row.selection_match_reason !== "exact_feeling" &&
            row.playback_status !== "exact"
    ).length;

    const needsAudioCount = queueRows.filter(
        (row) => row.admin_queue_status === "needs_audio"
    ).length;

    const categories = Array.from(
        new Set(playbackRows.map((row) => row.category_name ?? "Uncategorized"))
    ).sort();

    const gapCategories = Array.from(
        new Set(gapRows.map((row) => row.category_name ?? "Uncategorized"))
    ).sort();

    const gapActions = Array.from(
        new Set(gapRows.map((row) => row.recommended_action ?? "review"))
    ).sort();

    const filteredGaps = gapRows.filter((row) => {
        const matchesExperience =
            experienceFilter === "all" || row.experience_type === experienceFilter;

        const matchesCategory =
            categoryFilter === "all" ||
            (row.category_name ?? "Uncategorized") === categoryFilter;

        const matchesAction =
            actionFilter === "all" ||
            (row.recommended_action ?? "review") === actionFilter;

        return matchesExperience && matchesCategory && matchesAction;
    });

    const queueStatuses = [
        "needs_script",
        "needs_audio",
        "ready_to_publish",
        "published",
        "blocked",
        "archived",
        "review_needed",
    ];

    return (
        <main className="min-h-screen bg-[#0B1220] px-6 py-10 text-white">
            <section className="mx-auto w-full max-w-7xl">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <Link
                            href="/content-ops"
                            className="text-sm font-bold text-white/50 hover:text-white"
                        >
                            ← Back to Content Ops
                        </Link>

                        <p className="mt-6 text-xs font-black uppercase tracking-[0.25em] text-[#FFB59A]">
                            Selfward Content Ops
                        </p>

                        <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                            Boost Admin Dashboard
                        </h1>

                        <p className="mt-4 max-w-3xl text-base font-semibold leading-8 text-white/60">
                            Review listener coverage and manage Boosts through the
                            creative production workflow.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Link
                            href="/content-ops/boosts/new"
                            className="rounded-full bg-[#FFB59A] px-5 py-2.5 text-sm font-black text-[#0B1220] transition hover:bg-[#ffc5af]"
                        >
                            + Start New Boost
                        </Link>

                        <Pill className="border-white/10 bg-white/5 text-white/60">
                            Content Ops
                        </Pill>
                    </div>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                    <StatCard label="Feelings" value={uniqueFeelings.size} />
                    <StatCard label="Playback slots" value={playbackRows.length} />
                    <StatCard label="Exact matches" value={exactMatches} />
                    <StatCard label="Fallbacks" value={fallbacks} />
                    <StatCard label="Gap queue" value={gapRows.length} />
                    <StatCard label="Needs audio" value={needsAudioCount} />
                </div>

                <section className="mt-10 rounded-[32px] border border-white/10 bg-white/[0.03] p-5 sm:p-7">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-2xl font-black">Creative Production</h2>
                            <p className="mt-2 text-sm font-semibold text-white/50">
                                Boosts moving through the new Architect → Writer → Voice Editor → Curator workflow.
                            </p>
                        </div>

                        <Pill className="border-white/10 bg-white/5 text-white/60">
                            {creativeRows.length} Boosts
                        </Pill>
                    </div>

                    <div className="mt-6 grid gap-4 lg:grid-cols-2">
                        {creativeRows.map((boost) => (
                            <Link
                                key={boost.id}
                                href={`/content-ops/boosts/${boost.id}`}
                                className="rounded-[22px] border border-white/10 bg-[#0F1A2E] p-5 transition hover:border-[#FFB59A]/30 hover:bg-white/[0.05]"
                            >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="font-black text-white">
                                            {boost.working_title}
                                        </p>

                                        <p className="mt-1 text-sm font-semibold text-white/45">
                                            {boost.trusted_voice ?? "No Trusted Voice"} ·{" "}
                                            {boost.boost_format ?? "Unknown format"}
                                        </p>
                                    </div>

                                    <Pill className="border-white/10 bg-white/5 text-white/50">
                                        {boost.status.replaceAll("_", " ")}
                                    </Pill>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-white/45">
                                    <p>
                                        Voice:{" "}
                                        {boost.voice_score != null
                                            ? `${boost.voice_score}/10`
                                            : "—"}
                                    </p>

                                    <p>
                                        Curator:{" "}
                                        {boost.curator_score != null
                                            ? `${boost.curator_score}/100`
                                            : "—"}
                                    </p>

                                    <p>
                                        Content:{" "}
                                        {boost.content_id ? "linked" : "not linked"}
                                    </p>

                                    <p className="text-[#FFB59A]">
                                        Open production →
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                <section className="mt-10 rounded-[32px] border border-white/10 bg-white/[0.03] p-5 sm:p-7">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-2xl font-black">Playback Map</h2>
                            <p className="mt-2 text-sm font-semibold text-white/50">
                                The current listener experience for each feeling and lane.
                            </p>
                        </div>
                    </div>

                    <div className="mt-7 space-y-8">
                        {categories.map((category) => {
                            const categoryRows = playbackRows.filter(
                                (row) => (row.category_name ?? "Uncategorized") === category
                            );

                            const feelingSlugs = Array.from(
                                new Set(categoryRows.map((row) => row.mindset_feeling_slug ?? "unknown"))
                            );

                            return (
                                <div key={category}>
                                    <h3 className="text-xl font-black text-[#FFB59A]">
                                        {category}
                                    </h3>

                                    <div className="mt-4 space-y-5">
                                        {feelingSlugs.map((slug) => {
                                            const feelingRows = categoryRows.filter(
                                                (row) => (row.mindset_feeling_slug ?? "unknown") === slug
                                            );

                                            const feelingName =
                                                feelingRows[0]?.mindset_feeling_name ?? slug;

                                            return (
                                                <div
                                                    key={slug}
                                                    className="rounded-[28px] border border-white/10 bg-[#0F1A2E] p-5"
                                                >
                                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                                        <div>
                                                            <h4 className="text-lg font-black">
                                                                {feelingName}
                                                            </h4>
                                                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                                                                {slug}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-5 grid gap-4 lg:grid-cols-3">
                                                        {experienceOrder.map((experience) => {
                                                            const lane = feelingRows.find(
                                                                (row) => row.experience_type === experience
                                                            );

                                                            return (
                                                                <div
                                                                    key={experience}
                                                                    className={`rounded-[24px] border p-5 ${statusStyles(
                                                                        lane?.playback_status ?? null,
                                                                        lane?.selection_match_reason ?? null
                                                                    )}`}
                                                                >
                                                                    <p className="text-xs font-black uppercase tracking-[0.2em] opacity-70">
                                                                        {experienceLabels[experience]}
                                                                    </p>

                                                                    <h5 className="mt-3 text-base font-black">
                                                                        {lane?.title ?? "Missing"}
                                                                    </h5>

                                                                    <div className="mt-4 space-y-2 text-sm font-bold opacity-80">
                                                                        <p>Type: {lane?.content_type ?? "—"}</p>
                                                                        <p>Voice: {lane?.trusted_voice_name ?? "—"}</p>
                                                                        <p>Duration: {formatDuration(lane?.duration_seconds ?? null)}</p>
                                                                        <p>Priority: {lane?.priority ?? "—"}</p>
                                                                        <p>Match: {lane?.selection_match_reason ?? "missing"}</p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="mt-10 rounded-[32px] border border-white/10 bg-white/[0.03] p-5 sm:p-7">
                    <h2 className="text-2xl font-black">Gap Queue</h2>
                    <p className="mt-2 text-sm font-semibold text-white/50">
                        Items needing exact content creation or editorial review.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                        <Link
                            href={buildFilterHref({ category: categoryFilter, action: actionFilter })}
                            className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${experienceFilter === "all"
                                    ? "border-[#FFB59A]/30 bg-[#FFB59A]/10 text-[#FFB59A]"
                                    : "border-white/10 bg-white/5 text-white/50"
                                }`}
                        >
                            All lanes
                        </Link>

                        {experienceOrder.map((experience) => (
                            <Link
                                key={experience}
                                href={buildFilterHref({
                                    experience,
                                    category: categoryFilter,
                                    action: actionFilter,
                                })}
                                className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${experienceFilter === experience
                                        ? "border-[#FFB59A]/30 bg-[#FFB59A]/10 text-[#FFB59A]"
                                        : "border-white/10 bg-white/5 text-white/50"
                                    }`}
                            >
                                {experienceLabels[experience]}
                            </Link>
                        ))}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                            href={buildFilterHref({ experience: experienceFilter, action: actionFilter })}
                            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/50"
                        >
                            All categories
                        </Link>

                        {gapCategories.map((category) => (
                            <Link
                                key={category}
                                href={buildFilterHref({
                                    experience: experienceFilter,
                                    category,
                                    action: actionFilter,
                                })}
                                className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${categoryFilter === category
                                        ? "border-[#FFB59A]/30 bg-[#FFB59A]/10 text-[#FFB59A]"
                                        : "border-white/10 bg-white/5 text-white/50"
                                    }`}
                            >
                                {category}
                            </Link>
                        ))}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                            href={buildFilterHref({ experience: experienceFilter, category: categoryFilter })}
                            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/50"
                        >
                            All actions
                        </Link>

                        {gapActions.map((action) => (
                            <Link
                                key={action}
                                href={buildFilterHref({
                                    experience: experienceFilter,
                                    category: categoryFilter,
                                    action,
                                })}
                                className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${actionFilter === action
                                        ? "border-[#FFB59A]/30 bg-[#FFB59A]/10 text-[#FFB59A]"
                                        : "border-white/10 bg-white/5 text-white/50"
                                    }`}
                            >
                                {action.replaceAll("_", " ")}
                            </Link>
                        ))}
                    </div>

                    <div className="mt-6 overflow-hidden rounded-[24px] border border-white/10">
                        <table className="w-full min-w-[900px] text-left text-sm">
                            <thead className="bg-white/5 text-xs font-black uppercase tracking-[0.16em] text-white/40">
                                <tr>
                                    <th className="p-4">Feeling</th>
                                    <th className="p-4">Lane</th>
                                    <th className="p-4">Action</th>
                                    <th className="p-4">Recommended</th>
                                    <th className="p-4">Current fallback</th>
                                    <th className="p-4">Voice</th>
                                    <th className="p-4">Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredGaps.map((row, index) => (
                                    <tr
                                        key={`${row.mindset_feeling_slug}-${row.experience_type}-${index}`}
                                        className="border-t border-white/10"
                                    >
                                        <td className="p-4 font-bold">
                                            <div>{row.mindset_feeling_name}</div>
                                            <div className="text-xs text-white/35">
                                                {row.category_name}
                                            </div>
                                        </td>
                                        <td className="p-4 font-bold">
                                            {experienceLabels[row.experience_type ?? ""] ?? row.experience_type}
                                        </td>
                                        <td className="p-4 font-bold text-[#FFB59A]">
                                            {row.recommended_action?.replaceAll("_", " ")}
                                        </td>
                                        <td className="p-4">{row.recommended_content_type}</td>
                                        <td className="p-4">{row.current_fallback_title}</td>
                                        <td className="p-4">{row.current_fallback_voice}</td>
                                        <td className="p-4">{formatDuration(row.current_fallback_duration)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="mt-10 rounded-[32px] border border-white/10 bg-white/[0.03] p-5 sm:p-7">
                    <h2 className="text-2xl font-black">Recipe Coverage</h2>
                    <p className="mt-2 text-sm font-semibold text-white/50">
                        Current generation plan by feeling.
                    </p>

                    <div className="mt-6 overflow-hidden rounded-[24px] border border-white/10">
                        <table className="w-full min-w-[900px] text-left text-sm">
                            <thead className="bg-white/5 text-xs font-black uppercase tracking-[0.16em] text-white/40">
                                <tr>
                                    <th className="p-4">Feeling</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Voice</th>
                                    <th className="p-4">Title seed</th>
                                    <th className="p-4">Emotional job</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recipeRows.map((row, index) => (
                                    <tr
                                        key={`${row.generation_recipe_id}-${index}`}
                                        className="border-t border-white/10"
                                    >
                                        <td className="p-4 font-bold">
                                            <div>{row.mindset_feeling_name}</div>
                                            <div className="text-xs text-white/35">
                                                {row.state_of_mind_category_name}
                                            </div>
                                        </td>
                                        <td className="p-4">{row.planned_content_type}</td>
                                        <td className="p-4">{row.trusted_voice_name}</td>
                                        <td className="p-4 font-bold text-white/80">
                                            {row.title_seed}
                                        </td>
                                        <td className="p-4 text-white/60">
                                            {row.emotional_job}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="mt-10 rounded-[32px] border border-white/10 bg-white/[0.03] p-5 sm:p-7">
                    <h2 className="text-2xl font-black">Production Queue</h2>
                    <p className="mt-2 text-sm font-semibold text-white/50">
                        Read-only production status for Boost content.
                    </p>

                    <div className="mt-6 space-y-6">
                        {queueStatuses.map((status) => {
                            const rows = queueRows.filter(
                                (row) => row.admin_queue_status === status
                            );

                            if (rows.length === 0) return null;

                            return (
                                <div key={status} className="rounded-[24px] border border-white/10 bg-[#0F1A2E] p-5">
                                    <h3 className="text-lg font-black capitalize">
                                        {status.replaceAll("_", " ")}{" "}
                                        <span className="text-white/35">({rows.length})</span>
                                    </h3>

                                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                                        {rows.slice(0, 40).map((row, index) => (
                                            <div
                                                key={`${row.content_id}-${index}`}
                                                className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4"
                                            >
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                    <div>
                                                        <p className="font-black">{row.title}</p>
                                                        <p className="mt-1 text-sm font-semibold text-white/45">
                                                            {row.mindset_feeling_name} · {row.trusted_voice_name}
                                                        </p>
                                                    </div>
                                                    <Pill className="border-white/10 bg-white/5 text-white/50">
                                                        {row.content_type}
                                                    </Pill>
                                                </div>

                                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-white/45">
                                                    <p>Editor: {row.editor_status}</p>
                                                    <p>Production: {row.production_status}</p>
                                                    <p>Active: {row.is_active ? "yes" : "no"}</p>
                                                    <p>Duration: {formatDuration(row.duration_seconds)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </section>
        </main>
    );
}