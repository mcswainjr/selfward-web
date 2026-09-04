import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createAdminClient } from "../../../../lib/supabase/admin";
import { createClient } from "../../../../lib/supabase/server";
import BoostCreativePipeline from "./BoostCreativePipeline";
import BoostCuratorPipeline from "./BoostCuratorPipeline";
import BoostHumanApproval from "./BoostHumanApproval";
import BoostRecordingScript from "./BoostRecordingScript";
import BoostAudioPreview from "./BoostAudioPreview";
import BoostRelease from "./BoostRelease";
import BoostTitleEditor from "./BoostTitleEditor";
import BoostFinalScriptEditor from "./BoostFinalScriptEditor";

type Boost = {
    id: string;
    working_title: string;
    slug: string;
    boost_format: string | null;
    trusted_voice: string | null;
    target_length: string | null;
    primary_theme: string | null;
    recommended_mood_categories: string[] | null;
    audience_tags: string[] | null;
    intended_listener_moment: string | null;
    emotional_job: string | null;
    core_insight: string | null;
    architect_brief: string | null;
    script_draft: string | null;
    revised_script: string | null;
    final_script: string | null;
    recording_script: string | null;
    editor_verdict: string | null;
    voice_score: number | null;
    editor_notes: string | null;
    recording_notes: string | null;
    curator_score: number | null;
    curator_action: string | null;
    curator_reason: string | null;
    revision_count: number | null;
    status: string;
    content_id: string | null;
    created_at: string;
    updated_at: string;
};

type ContentRecord = {
    id: string;
    title: string | null;
    description: string | null;
    content_type: string | null;
    trusted_voice: string | null;
    script_text: string | null;
    audio_url: string | null;
    duration_seconds: number | null;
    editor_status: string | null;
    production_status: string | null;
    is_active: boolean | null;
    published_at: string | null;
    unpublished_at: string | null;
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

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
                {label}
            </p>
            <div className="mt-2 font-semibold leading-7 text-white/75">
                {children || "—"}
            </div>
        </div>
    );
}

function ScriptPanel({
    label,
    script,
}: {
    label: string;
    script: string | null;
}) {
    if (!script) return null;

    return (
        <div className="rounded-[24px] border border-white/10 bg-[#0F1A2E] p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/35">
                {label}
            </p>
            <div className="mt-4 whitespace-pre-wrap text-[15px] font-semibold leading-8 text-white/75">
                {script}
            </div>
        </div>
    );
}

function formatDuration(seconds: number | null) {
    if (!seconds || seconds <= 0) return "—";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export default async function BoostProductionPage({
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

    const { data: boostData, error: boostError } = await admin
        .from("boosts")
        .select(
            `
            id,
            working_title,
            slug,
            boost_format,
            trusted_voice,
            target_length,
            primary_theme,
            recommended_mood_categories,
            audience_tags,
            intended_listener_moment,
            emotional_job,
            core_insight,
            architect_brief,
            script_draft,
            revised_script,
            final_script,
            recording_script,
            editor_verdict,
            voice_score,
            editor_notes,
            recording_notes,
            curator_score,
            curator_action,
            curator_reason,
            revision_count,
            status,
            content_id,
            created_at,
            updated_at
            `
        )
        .eq("id", id)
        .maybeSingle();

    if (boostError) {
        console.error("Boost detail load error:", boostError);
        throw new Error("Unable to load Boost.");
    }

    if (!boostData) {
        notFound();
    }

    const boost = boostData as Boost;

    let content: ContentRecord | null = null;

    if (boost.content_id) {
        const { data: contentData, error: contentError } = await admin
            .from("content")
            .select(
                `
                id,
                title,
                description,
                content_type,
                trusted_voice,
                script_text,
                audio_url,
                duration_seconds,
                editor_status,
                production_status,
                is_active,
                published_at,
                unpublished_at
                `
            )
            .eq("id", boost.content_id)
            .maybeSingle();

        if (contentError) {
            console.error("Boost linked content load error:", contentError);
            throw new Error("Unable to load linked Boost content.");
        }

        content = contentData as ContentRecord | null;
    }

    const editorApproved =
        !!boost.final_script &&
        ["APPROVED", "APPROVED WITH MINOR EDITS"].includes(
            boost.editor_verdict ?? ""
        );

    const curatorSelected = [
        "APPROVE FOR RECORDING",
        "APPROVE AFTER MICRO-EDITS",
    ].includes(boost.curator_action ?? "");

    const humanApproved = [
        "human_approved",
        "recorded",
        "published",
    ].includes(boost.status);

    const contentCreated = !!boost.content_id && !!content;
    const audioConnected = !!content?.audio_url && !!content?.duration_seconds;
    const published = !!content?.is_active && !!content?.published_at;

    return (
        <main className="min-h-screen bg-[#0B1220] px-6 py-10 text-white">
            <section className="mx-auto w-full max-w-6xl">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <Link
                            href="/content-ops/boosts"
                            className="text-sm font-bold text-white/50 hover:text-white"
                        >
                            ← Back to Boost Dashboard
                        </Link>

                        <p className="mt-6 text-xs font-black uppercase tracking-[0.25em] text-[#FFB59A]">
                            Selfward Content Ops
                        </p>

                        <BoostTitleEditor
                            boostId={boost.id}
                            workingTitle={boost.working_title}
                            editable={!boost.content_id}
                        />

                        <p className="mt-4 font-semibold text-white/50">
                            {boost.trusted_voice ?? "No Trusted Voice"} ·{" "}
                            {boost.boost_format ?? "Unknown format"} ·{" "}
                            {boost.target_length ?? "No target length"}
                        </p>
                    </div>

                    <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/60">
                        {boost.status.replaceAll("_", " ")}
                    </div>
                </div>

                <section className="mt-10 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
                        <h2 className="text-xl font-black">Creative Pipeline</h2>

                        <div className="mt-5 space-y-3">
                            <StatusCheck
                                label="Architecture created"
                                ready={!!boost.architect_brief}
                            />
                            <StatusCheck
                                label="Writer draft created"
                                ready={!!boost.script_draft}
                            />
                            <StatusCheck
                                label="Voice Editor approved"
                                ready={editorApproved}
                            />
                            <StatusCheck
                                label="Curator selected for recording"
                                ready={curatorSelected}
                            />
                            <StatusCheck
                                label="Human approved for recording"
                                ready={humanApproved}
                            />
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
                        <h2 className="text-xl font-black">Media Production</h2>

                        <div className="mt-5 space-y-3">
                            <StatusCheck
                                label="Playable content record created"
                                ready={contentCreated}
                            />
                            <StatusCheck
                                label="Finished audio connected"
                                ready={audioConnected}
                            />
                            <StatusCheck
                                label="Boost released"
                                ready={published}
                            />
                        </div>

                        {!contentCreated && humanApproved ? (
                            <div className="mt-5 rounded-[18px] border border-amber-400/20 bg-amber-400/10 p-4">
                                <p className="text-sm font-bold text-amber-100">
                                    Creative production is complete. This Boost is waiting
                                    for the media-production workflow.
                                </p>
                            </div>
                        ) : null}
                    </div>
                </section>

                <BoostCreativePipeline
                    boostId={boost.id}
                    status={boost.status}
                    scriptDraft={boost.script_draft}
                    finalScript={boost.final_script}
                    editorVerdict={boost.editor_verdict}
                    editorNotes={boost.editor_notes}
                    curatorAction={boost.curator_action}
                    revisionCount={boost.revision_count}
                    recordingScript={boost.recording_script}
                    contentId={boost.content_id}
                />

                <BoostCuratorPipeline
                    boostId={boost.id}
                    status={boost.status}
                    finalScript={boost.final_script}
                    editorVerdict={boost.editor_verdict}
                    curatorScore={boost.curator_score}
                    curatorAction={boost.curator_action}
                    curatorReason={boost.curator_reason}
                    contentId={boost.content_id}
                />

                <BoostHumanApproval
                    boostId={boost.id}
                    status={boost.status}
                    curatorAction={boost.curator_action}
                    curatorScore={boost.curator_score}
                    contentId={boost.content_id}
                />

                <BoostRecordingScript
                    boostId={boost.id}
                    status={boost.status}
                    finalScript={boost.final_script}
                    recordingScript={boost.recording_script}
                    editorVerdict={boost.editor_verdict}
                    editorNotes={boost.editor_notes}
                    contentId={boost.content_id}
                />

                <BoostAudioPreview
                    boostId={boost.id}
                    status={boost.status}
                    recordingScript={boost.recording_script}
                    contentId={boost.content_id}
                />

                <BoostRelease
                    boostId={boost.id}
                    boostTitle={boost.working_title}
                    status={boost.status}
                    contentId={boost.content_id}
                    contentIsActive={content?.is_active ?? null}
                    publishedAt={content?.published_at ?? null}
                    unpublishedAt={content?.unpublished_at ?? null}
                    editorStatus={content?.editor_status ?? null}
                    productionStatus={content?.production_status ?? null}
                    audioUrl={content?.audio_url ?? null}
                    durationSeconds={content?.duration_seconds ?? null}
                />

                <section className="mt-10 rounded-[32px] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
                    <h2 className="text-2xl font-black">Architecture</h2>

                    <div className="mt-7 grid gap-7 lg:grid-cols-2">
                        <Field label="Primary theme">
                            {boost.primary_theme}
                        </Field>

                        <Field label="Target length">
                            {boost.target_length}
                        </Field>

                        <Field label="Intended listener moment">
                            {boost.intended_listener_moment}
                        </Field>

                        <Field label="Emotional job">
                            {boost.emotional_job}
                        </Field>

                        <div className="lg:col-span-2">
                            <Field label="Core insight">
                                {boost.core_insight}
                            </Field>
                        </div>

                        <div className="lg:col-span-2">
                            <Field label="Architect brief">
                                <div className="whitespace-pre-wrap">
                                    {boost.architect_brief}
                                </div>
                            </Field>
                        </div>

                        <Field label="Mood categories">
                            {(boost.recommended_mood_categories ?? []).join(", ") || "—"}
                        </Field>

                        <Field label="Audience tags">
                            {(boost.audience_tags ?? []).join(", ") || "—"}
                        </Field>
                    </div>
                </section>

                <section className="mt-10">
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-black">Script</h2>
                            <p className="mt-2 text-sm font-semibold text-white/50">
                                Read-only creative history for this Boost.
                            </p>
                        </div>

                        <div className="text-right text-sm font-bold text-white/40">
                            Revisions: {boost.revision_count ?? 0}
                        </div>
                    </div>

                    <div className="mt-6 space-y-5">
                        {boost.final_script ? (
                            <BoostFinalScriptEditor
                                boostId={boost.id}
                                finalScript={boost.final_script}
                                editable={
                                    boost.status === "editor_approved" &&
                                    !boost.curator_action &&
                                    !boost.content_id
                                }
                            />
                        ) : (
                            <ScriptPanel
                                label="Final approved script"
                                script={boost.final_script}
                            />
                        )}

                        {boost.revised_script &&
                        boost.revised_script !== boost.final_script ? (
                            <details className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                                <summary className="cursor-pointer font-black text-white/70">
                                    Revised script
                                </summary>
                                <div className="mt-4 whitespace-pre-wrap text-[15px] font-semibold leading-8 text-white/65">
                                    {boost.revised_script}
                                </div>
                            </details>
                        ) : null}

                        {boost.script_draft &&
                        boost.script_draft !== boost.final_script ? (
                            <details className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                                <summary className="cursor-pointer font-black text-white/70">
                                    Writer draft
                                </summary>
                                <div className="mt-4 whitespace-pre-wrap text-[15px] font-semibold leading-8 text-white/65">
                                    {boost.script_draft}
                                </div>
                            </details>
                        ) : null}
                    </div>
                </section>

                <section className="mt-10 grid gap-6 lg:grid-cols-2">
                    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
                        <h2 className="text-xl font-black">Voice Editor</h2>

                        <div className="mt-6 space-y-5">
                            <Field label="Verdict">
                                {boost.editor_verdict}
                            </Field>

                            <Field label="Voice score">
                                {boost.voice_score != null
                                    ? `${boost.voice_score}/10`
                                    : "—"}
                            </Field>

                            <Field label="Editor notes">
                                <div className="whitespace-pre-wrap">
                                    {boost.editor_notes}
                                </div>
                            </Field>

                            <Field label="Recording notes">
                                <div className="whitespace-pre-wrap">
                                    {boost.recording_notes}
                                </div>
                            </Field>
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
                        <h2 className="text-xl font-black">Curator</h2>

                        <div className="mt-6 space-y-5">
                            <Field label="Action">
                                {boost.curator_action}
                            </Field>

                            <Field label="Score">
                                {boost.curator_score != null
                                    ? `${boost.curator_score}/100`
                                    : "—"}
                            </Field>

                            <Field label="Reason">
                                <div className="whitespace-pre-wrap">
                                    {boost.curator_reason}
                                </div>
                            </Field>
                        </div>
                    </div>
                </section>

                <section className="mt-10 rounded-[32px] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
                    <h2 className="text-2xl font-black">Playable Content</h2>

                    {!content ? (
                        <div className="mt-6 rounded-[22px] border border-white/10 bg-[#0F1A2E] p-5">
                            <p className="font-bold text-white/55">
                                No playable content record is linked to this Boost yet.
                            </p>
                            <p className="mt-2 text-sm font-semibold leading-6 text-white/40">
                                Boost content ID: {boost.content_id ?? "none"}
                            </p>
                        </div>
                    ) : (
                        <div className="mt-7 grid gap-6 lg:grid-cols-2">
                            <Field label="Content title">
                                {content.title}
                            </Field>

                            <Field label="Content type">
                                {content.content_type}
                            </Field>

                            <Field label="Production status">
                                {content.production_status}
                            </Field>

                            <Field label="Editor status">
                                {content.editor_status}
                            </Field>

                            <Field label="Duration">
                                {formatDuration(content.duration_seconds)}
                            </Field>

                            <Field label="Active">
                                {content.is_active ? "Yes" : "No"}
                            </Field>

                            <div className="lg:col-span-2">
                                <Field label="Audio URL">
                                    {content.audio_url ? (
                                        <a
                                            href={content.audio_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="break-all text-[#FFB59A] hover:underline"
                                        >
                                            {content.audio_url}
                                        </a>
                                    ) : (
                                        "—"
                                    )}
                                </Field>
                            </div>
                        </div>
                    )}
                </section>
            </section>
        </main>
    );
}
