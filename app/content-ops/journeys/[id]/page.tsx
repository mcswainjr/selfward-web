import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { createClient } from "../../../../lib/supabase/server";
import {
    approveJourneyForRecordingFromContentOps,
    editApprovedJourneyScript,
    saveRecordingScript,
} from "./actions";
import JourneyAudioUploader from "./JourneyAudioUploader";
import JourneyImageUploader from "./JourneyImageUploader";
import JourneyCreativePipeline from "./JourneyCreativePipeline";
import LegacyAudioConnector from "./LegacyAudioConnector";


type Journey = {
    id: string;
    title: string;
    slug: string;
    trusted_voice: string | null;
    num_days: number;
    status: string;
    is_active: boolean;
    pipeline_purpose: string;
    cover_image_url: string | null;
    hero_image_url: string | null;
};

type JourneyStep = {
    id: string;
    step_number: number;
    title: string;
    status: string;
    script_draft: string | null;
    final_script: string | null;
    recording_script: string | null;
    editor_verdict: string | null;
    editor_notes: string | null;
    revision_count: number | null;
    content_id: string | null;
};

type ContentRecord = {
    id: string;
    audio_url: string | null;
    duration_seconds: number | null;
};

type CuratorSlateItem = {
    id: string;
    weekly_slate_id: string;
    journey_step_id: string | null;
    rank: number | null;
    score: number | null;
    curator_action: string | null;
    curator_reason: string | null;
    human_decision: string | null;
};

function StatusCheck({
    label,
    ready,
}: {
    label: string;
    ready: boolean;
}) {
    return (
        <div className="flex items-center gap-2 text-sm font-bold">
            <span className={ready ? "text-emerald-400" : "text-white/30"}>
                {ready ? "✓" : "○"}
            </span>

            <span className={ready ? "text-white/75" : "text-white/45"}>
                {label}
            </span>
        </div>
    );
}

function formatDuration(seconds: number | null) {
    if (!seconds || seconds <= 0) return null;

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export default async function JourneyProductionPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    /*
      Gate 1:
      Require a valid Supabase user.
    */
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/content-ops/login");
    }

    /*
      Gate 2:
      Require the designated Content Ops admin email.
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

    const admin = createAdminClient();

    /*
      Load the Journey.
    */
    const { data: journeyData, error: journeyError } = await admin
        .from("journeys")
        .select(
            `
        id,
        title,
        slug,
        trusted_voice,
        num_days,
        status,
        is_active,
        pipeline_purpose,
        cover_image_url,
        hero_image_url
      `
        )
        .eq("id", id)
        .eq("pipeline_purpose", "production")
        .maybeSingle();

    if (journeyError) {
        console.error("Journey detail load error:", journeyError);
        throw new Error("Unable to load Journey.");
    }

    if (!journeyData) {
        notFound();
    }

    const journey = journeyData as Journey;

    /*
      Load all days in order.
    */
    const { data: stepData, error: stepError } = await admin
        .from("journey_steps")
        .select(
            `
        id,
        step_number,
        title,
        status,
        script_draft,
        final_script,
        recording_script,
        editor_verdict,
        editor_notes,
        revision_count,
        content_id
      `
        )
        .eq("journey_id", id)
        .order("step_number", { ascending: true });

    if (stepError) {
        console.error("Journey step load error:", stepError);
        throw new Error("Unable to load Journey steps.");
    }

    const steps = (stepData ?? []) as JourneyStep[];

    /*
      Load the current Curator recommendation, if this Journey
      is waiting at the human production-approval gate.

      This query is read-only. It does not run the Curator and
      does not approve the Journey.
    */
    const {
        data: curatorItemData,
        error: curatorItemError,
    } = await admin
        .from("weekly_slate_items")
        .select(
            `
        id,
        weekly_slate_id,
        journey_step_id,
        rank,
        score,
        curator_action,
        curator_reason,
        human_decision
      `
        )
        .eq("journey_id", id)
        .is("human_decision", null)
        .order("rank", { ascending: true });

    if (curatorItemError) {
        console.error(
            "Journey Curator review load error:",
            curatorItemError
        );

        throw new Error(
            "Unable to load Journey Curator review."
        );
    }

    const curatorItems =
        (curatorItemData ?? []) as CuratorSlateItem[];

    const curatorReview =
        curatorItems[0] ?? null;

    const curatorPackageItems =
        curatorReview
            ? curatorItems.filter(
                  (item) =>
                      item.weekly_slate_id ===
                      curatorReview.weekly_slate_id
              )
            : [];

    const recordingApprovalCuratorActions =
        new Set([
            "APPROVE FOR RECORDING",
            "APPROVE AFTER MICRO-EDITS",
        ]);

    const canApproveJourneyForRecording =
        Boolean(curatorReview) &&
        journey.pipeline_purpose ===
            "production" &&
        !journey.is_active &&
        journey.status ===
            "coherence_approved" &&
        curatorPackageItems.length ===
            journey.num_days &&
        curatorPackageItems.every(
            (item) =>
                recordingApprovalCuratorActions.has(
                    item.curator_action ?? ""
                )
        ) &&
        steps.length === journey.num_days &&
        steps.every(
            (step) =>
                step.status ===
                    "pending_human_approval" &&
                Boolean(
                    step.final_script?.trim()
                ) &&
                Boolean(
                    step.recording_script?.trim()
                ) &&
                !step.content_id
        );

    /*
      Load attached playable content only when a step has content_id.
    */
    const contentIds = steps
        .map((step) => step.content_id)
        .filter((contentId): contentId is string => Boolean(contentId));

    let contentById = new Map<string, ContentRecord>();

    if (contentIds.length > 0) {
        const { data: contentData, error: contentError } = await admin
            .from("content")
            .select("id, audio_url, duration_seconds")
            .in("id", contentIds);

        if (contentError) {
            console.error("Journey content load error:", contentError);
            throw new Error("Unable to load Journey audio.");
        }

        contentById = new Map(
            ((contentData ?? []) as ContentRecord[]).map((record) => [
                record.id,
                record,
            ])
        );
    }

    const coverReady = Boolean(journey.cover_image_url?.trim());
    const heroReady = Boolean(journey.hero_image_url?.trim());

    const LEGACY_AUDIO_OBJECTS: Record<string, string> = {
        // Stuck in the Middle
        "1634105a-38aa-4a18-a56d-7653d93ff212":
            "journey_stuck-in-the-middle_day-1_stop-calling-it-just-helping.mp3",

        "5c8e3ec8-ccdc-425f-8f6d-69b4d6d07ff5":
            "journey_stuck-in-the-middle_day-2_overwork-is-not-a-strategy.mp3",

        "4d964ffb-c741-4fdf-9194-ee4e23878d99":
            "journey_stuck-in-the-middle_day-3_move-with-strategy.mp3",

        // You Don’t Even Like This App
        "8d9f5015-d351-4760-add8-714460aaad40":
            "journey_you-dont-even-like-this-app_day-1_the-scroll-has-a-side-hustle (2).mp3",

        "880a643f-4281-4547-83a3-d705b7ac84a0":
            "journey_you-dont-even-like-this-app_day-2_take-your-brain-back.mp3",

        // You Don't Have to Fight Every Battle
        "987d3552-0e28-4e3f-ba89-e6d0b5ab9ccf":
            "journey_you-dont-have-to-fight-every-battle_day-1_notice-the-pull-to-respond.mp3",

        "3b2a3175-c487-4afb-8f5f-fe489b26f5c5":
            "journey_you-dont-have-to-fight-every-battle_day-2_choose-what-deserves-your-voice.mp3",
    };
    return (
        <main className="min-h-screen bg-[#0B1220] px-6 py-10 text-white sm:px-8">
            <section className="mx-auto w-full max-w-6xl">
                <Link
                    href="/content-ops"
                    className="text-sm font-black text-white/45 transition hover:text-white"
                >
                    ← Back to Content Ops
                </Link>

                <header className="mt-8 border-b border-white/10 pb-8">
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-[#FFB59A]">
                        Journey Production
                    </p>

                    <h1 className="max-w-4xl text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                        {journey.title}
                    </h1>

                    <p className="mt-3 font-bold text-white/50">
                        {journey.trusted_voice ?? "Voice not assigned"} ·{" "}
                        {journey.num_days} {journey.num_days === 1 ? "day" : "days"}
                    </p>
                </header>

                <section className="mt-8 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-6">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/40">
                            Journey Assets
                        </p>

                        <div className="mt-4 grid gap-3">
                            <StatusCheck label="Cover" ready={coverReady} />
                            <StatusCheck label="Hero" ready={heroReady} />
                        </div>
                    </div>

                    <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-6">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/40">
                            Database State
                        </p>

                        <div className="mt-4 space-y-2 text-sm font-bold text-white/65">
                            <p>Status: {journey.status}</p>
                            <p>{journey.is_active ? "Live" : "Not live"}</p>
                        </div>
                    </div>
                </section>

                {journey.pipeline_purpose === "production" &&
                    !journey.is_active &&
                    ["architected", "in_production", "coherence_approved"].includes(journey.status) && (
                        <JourneyCreativePipeline
                            journeyId={journey.id}
                            journeyStatus={journey.status}
                            steps={steps.map((step) => ({
                                id: step.id,
                                stepNumber: step.step_number,
                                status: step.status,
                                scriptDraft: step.script_draft,
                                editorVerdict: step.editor_verdict,
                                editorNotes: step.editor_notes,
                                revisionCount: step.revision_count,
                            }))}
                        />
                    )}

                {curatorReview && (
                    <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.05] p-6 sm:p-7">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                            <div className="max-w-3xl">
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFB59A]">
                                    Human Review
                                </p>

                                <h2 className="mt-2 text-xl font-black text-white">
                                    Curator Review
                                </h2>

                                <p className="mt-2 text-sm font-semibold leading-6 text-white/45">
                                    The Curator has reviewed the complete Journey
                                    package. No final human approval has been made.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3 lg:justify-end">
                                {typeof curatorReview.score === "number" && (
                                    <div className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-black text-white/75">
                                        {curatorReview.score}/100
                                    </div>
                                )}

                                <div className="rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-sm font-black text-amber-200">
                                    {curatorReview.curator_action ===
                                    "APPROVE AFTER MICRO-EDITS"
                                        ? "Approve after micro-edits"
                                        : curatorReview.curator_action ===
                                            "APPROVE FOR RECORDING"
                                          ? "Approve for recording"
                                          : curatorReview.curator_action
                                                ?.toLowerCase()
                                                .replaceAll("_", " ") ??
                                            "Curator review complete"}
                                </div>
                            </div>
                        </div>

                        {curatorReview.curator_reason && (
                            <div className="mt-6 rounded-[22px] border border-white/10 bg-[#0B1220]/60 p-5">
                                <p className="text-xs font-black uppercase tracking-[0.14em] text-white/35">
                                    Curator recommendation
                                </p>

                                <p className="mt-3 text-sm font-semibold leading-7 text-white/70">
                                    {curatorReview.curator_reason}
                                </p>
                            </div>
                        )}

                        {curatorReview.curator_action ===
                            "APPROVE AFTER MICRO-EDITS" && (
                            <div className="mt-5 rounded-[22px] border border-amber-300/20 bg-amber-300/[0.06] p-5">
                                <p className="text-sm font-black text-amber-200">
                                    Production polish requested
                                </p>

                                <p className="mt-2 text-sm font-semibold leading-6 text-white/55">
                                    Make only the small production edits you agree
                                    with before final recording approval. This
                                    recommendation does not reopen the Journey's
                                    architecture, coherence review, or Trusted
                                    Voice assignment.
                                </p>
                            </div>
                        )}

                        {canApproveJourneyForRecording && curatorReview && (
                            <div className="mt-6 rounded-[22px] border border-emerald-300/20 bg-emerald-300/[0.06] p-5">
                                <p className="text-sm font-black text-emerald-200">
                                    Final human production decision
                                </p>

                                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/55">
                                    Approving this Journey marks all {journey.num_days} Days
                                    human approved and unlocks the recording stage. It does
                                    not publish, release, or make the Journey live.
                                </p>

                                <form
                                    action={
                                        approveJourneyForRecordingFromContentOps
                                    }
                                    className="mt-4"
                                >
                                    <input
                                        type="hidden"
                                        name="journey_id"
                                        value={journey.id}
                                    />

                                    <input
                                        type="hidden"
                                        name="weekly_slate_item_id"
                                        value={curatorReview.id}
                                    />

                                    <button
                                        type="submit"
                                        className="inline-flex rounded-full bg-emerald-300 px-5 py-3 text-sm font-black text-[#0B1220] transition hover:bg-emerald-200"
                                    >
                                        Approve Journey for Recording
                                    </button>
                                </form>
                            </div>
                        )}

                        <div className="mt-5 flex flex-col gap-2 border-t border-white/10 pt-5 text-sm font-semibold text-white/45 sm:flex-row sm:items-center sm:justify-between">
                            <p>
                                {curatorPackageItems.length} Day
                                {curatorPackageItems.length === 1 ? "" : "s"} in
                                this Curator package
                            </p>

                            <p className="font-bold text-white/60">
                                One Journey · one human approval decision
                            </p>
                        </div>
                    </section>
                )}

                <section className="mt-10">
                    <div className="mb-5">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFB59A]">
                            Creative Assets
                        </p>

                        <h2 className="mt-2 text-2xl font-black tracking-[-0.03em]">
                            Journey Artwork
                        </h2>

                        <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/45">
                            Upload and connect the final production artwork for this Journey.
                            Images are locked here once connected.
                        </p>
                    </div>

                    <div className="grid gap-5">
                        <JourneyImageUploader
                            journeyId={journey.id}
                            assetType="cover"
                            currentUrl={
                                journey.cover_image_url?.trim() || null
                            }
                        />

                        <JourneyImageUploader
                            journeyId={journey.id}
                            assetType="hero"
                            currentUrl={
                                journey.hero_image_url?.trim() || null
                            }
                        />
                    </div>
                </section>
                <div className="mt-10 space-y-6">
                    {steps.map((step) => {
                        const content = step.content_id
                            ? contentById.get(step.content_id)
                            : undefined;

                        const finalScriptReady = Boolean(step.final_script?.trim());
                        const recordingScriptReady = Boolean(
                            step.recording_script?.trim()
                        );

                        const audioReady = Boolean(
                            content?.audio_url?.trim() &&
                            content.duration_seconds &&
                            content.duration_seconds > 0
                        );

                        const duration = formatDuration(
                            content?.duration_seconds ?? null
                        );

                        const audioUrl = content?.audio_url?.trim() ?? "";

                        const legacyStorageObjectName =
                            LEGACY_AUDIO_OBJECTS[step.id] ?? null;

                        const legacyAudioUrl = legacyStorageObjectName
                            ? admin.storage
                                .from("Journeys Audio")
                                .getPublicUrl(legacyStorageObjectName)
                                .data.publicUrl
                            : null;

                        return (
                            <article
                                key={step.id}
                                className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6 shadow-xl shadow-black/10 sm:p-8"
                            >
                                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFB59A]">
                                            Day {step.step_number}
                                        </p>

                                        <h2 className="mt-2 text-2xl font-black tracking-[-0.03em]">
                                            {step.title}
                                        </h2>

                                        <p className="mt-2 text-sm font-bold text-white/40">
                                            {step.status}
                                        </p>
                                    </div>

                                    <div className="grid min-w-[220px] gap-2 rounded-2xl border border-white/[0.07] bg-black/10 p-4">
                                        <StatusCheck
                                            label="Approved script"
                                            ready={finalScriptReady}
                                        />

                                        <StatusCheck
                                            label="Recording script"
                                            ready={recordingScriptReady}
                                        />

                                        <StatusCheck
                                            label={
                                                duration
                                                    ? `Finished audio · ${duration}`
                                                    : "Finished audio"
                                            }
                                            ready={audioReady}
                                        />
                                    </div>
                                </div>

                                <div className="mt-7 grid gap-5 lg:grid-cols-2">
                                    <section className="rounded-[22px] border border-white/[0.07] bg-black/10 p-5">
                                        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/40">
                                            Approved Script
                                        </p>

                                        {step.final_script?.trim() ? (
                                            step.status === "editor_approved" &&
                                            journey.pipeline_purpose === "production" &&
                                            !journey.is_active &&
                                            !recordingScriptReady &&
                                            !step.content_id ? (
                                                <form
                                                    action={editApprovedJourneyScript}
                                                    className="mt-4"
                                                >
                                                    <input
                                                        type="hidden"
                                                        name="journey_id"
                                                        value={journey.id}
                                                    />

                                                    <input
                                                        type="hidden"
                                                        name="step_id"
                                                        value={step.id}
                                                    />

                                                    <textarea
                                                        name="approved_script"
                                                        defaultValue={step.final_script}
                                                        rows={18}
                                                        className="w-full resize-y rounded-2xl border border-white/10 bg-[#0B1220]/70 px-4 py-4 text-sm font-semibold leading-7 text-white/80 outline-none transition focus:border-[#FFB59A]/60"
                                                    />

                                                    <p className="mt-3 text-xs font-bold leading-5 text-white/35">
                                                        You can make final human edits here until a Recording Script is saved.
                                                    </p>

                                                    <button
                                                        type="submit"
                                                        className="mt-4 inline-flex rounded-full bg-[#FFB59A] px-5 py-2.5 text-sm font-black text-[#0B1220] transition hover:bg-[#ffc5af]"
                                                    >
                                                        Save Approved Script
                                                    </button>
                                                </form>
                                            ) : (
                                                <div className="mt-4 whitespace-pre-wrap text-sm font-semibold leading-7 text-white/70">
                                                    {step.final_script}
                                                </div>
                                            )
                                        ) : (
                                            <p className="mt-4 text-sm font-semibold text-white/35">
                                                No approved script stored.
                                            </p>
                                        )}
                                    </section>

                                    <section className="rounded-[22px] border border-white/[0.07] bg-black/10 p-5">
                                        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/40">
                                            Recording Script
                                        </p>

                                        <form action={saveRecordingScript} className="mt-4">
                                            <input
                                                type="hidden"
                                                name="journey_id"
                                                value={journey.id}
                                            />

                                            <input
                                                type="hidden"
                                                name="step_id"
                                                value={step.id}
                                            />

                                            <textarea
                                                name="recording_script"
                                                defaultValue={
                                                    step.recording_script?.trim()
                                                        ? step.recording_script
                                                        : step.final_script ?? ""
                                                }
                                                rows={18}
                                                className="w-full resize-y rounded-2xl border border-white/10 bg-[#0B1220]/70 px-4 py-4 text-sm font-semibold leading-7 text-white/80 outline-none transition focus:border-[#F97316]/60"
                                            />

                                            {!recordingScriptReady && finalScriptReady && (
                                                <p className="mt-3 text-xs font-bold leading-5 text-white/35">
                                                    The approved script has been copied here as your starting
                                                    point. Edit it if needed, then save the version that will
                                                    actually be recorded.
                                                </p>
                                            )}

                                            <button
                                                type="submit"
                                                className="mt-4 inline-flex rounded-full bg-[#F97316] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#fb8a3c]"
                                            >
                                                {recordingScriptReady
                                                    ? "Save Recording Script"
                                                    : "Use as Recording Script"}
                                            </button>
                                        </form>
                                    </section>

                                </div>

                                {legacyStorageObjectName &&
                                    legacyAudioUrl &&
                                    !step.content_id && (
                                        <LegacyAudioConnector
                                            journeyId={journey.id}
                                            stepId={step.id}
                                            storageObjectName={legacyStorageObjectName}
                                            audioUrl={legacyAudioUrl}
                                        />
                                    )}

                                {journey.pipeline_purpose === "production" &&
                                    (journey.status === "in_production" ||
                                        journey.status === "coherence_approved") &&
                                    !journey.is_active &&
                                    step.status === "human_approved" &&
                                    finalScriptReady &&
                                    recordingScriptReady &&
                                    !step.content_id &&
                                    !legacyStorageObjectName && (
                                        <JourneyAudioUploader
                                            journeyId={journey.id}
                                            stepId={step.id}
                                        />
                                    )}

                                {audioUrl && (
                                    <div className="mt-5 rounded-[20px] border border-white/[0.07] bg-black/10 p-4">
                                        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/35">
                                            Audio
                                        </p>

                                        <audio
                                            controls
                                            preload="none"
                                            className="mt-3 w-full"
                                            src={audioUrl}
                                        />
                                    </div>
                                )
                                }
                            </article>
                        );
                    })}
                </div>

                {steps.length !== journey.num_days && (
                    <div className="mt-8 rounded-[24px] border border-red-400/20 bg-red-400/10 p-5">
                        <p className="font-black text-red-100">
                            Data check: expected {journey.num_days} days but found{" "}
                            {steps.length}.
                        </p>
                    </div>
                )}
            </section>
        </main >
    );
}
