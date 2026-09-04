"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "../../../../lib/supabase/admin";
import { createClient } from "../../../../lib/supabase/server";

type CreativeOrchestratorPayload = Record<string, unknown>;

async function requireContentOpsAdmin() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("You must be signed in to use Content Ops.");
    }

    const adminEmail = process.env.CONTENT_OPS_ADMIN_EMAIL
        ?.trim()
        .toLowerCase();

    if (!adminEmail) {
        throw new Error("CONTENT_OPS_ADMIN_EMAIL is not configured.");
    }

    const userEmail = user.email?.trim().toLowerCase();

    if (userEmail !== adminEmail) {
        throw new Error(
            "This account does not have permission to use Content Ops."
        );
    }

    return createAdminClient();
}

async function callCreativeOrchestratorFromContentOps(
    payload: CreativeOrchestratorPayload
) {
    const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

    const creativeToken =
        process.env.CREATIVE_ORCHESTRATOR_TOKEN?.trim();

    if (!supabaseUrl) {
        throw new Error(
            "Content Ops is missing the Supabase URL."
        );
    }

    if (!creativeToken) {
        throw new Error(
            "Content Ops is missing the Creative Orchestrator token."
        );
    }

    const functionUrl =
        `${supabaseUrl.replace(/\/+$/, "")}/functions/v1/creative-orchestrator`;

    const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-creative-token": creativeToken,
        },
        body: JSON.stringify(payload),
        cache: "no-store",
    });

    let result: any = null;

    try {
        result = await response.json();
    } catch {
        throw new Error(
            "Creative Orchestrator returned an unreadable response."
        );
    }

    if (!response.ok || result?.success !== true) {
        console.error(
            "Creative Orchestrator Boost Content Ops error:",
            result
        );

        const detail =
            typeof result?.detail === "string"
                ? result.detail
                : typeof result?.error === "string"
                  ? result.error
                  : "Creative pipeline action failed.";

        throw new Error(detail);
    }

    return result;
}

async function loadBoost(admin: any, boostId: string) {
    const { data, error } = await admin
        .from("boosts")
        .select(
            `
            id,
            working_title,
            status,
            architect_brief,
            script_draft,
            revised_script,
            final_script,
            recording_script,
            editor_verdict,
            voice_score,
            editor_notes,
            recording_notes,
            revision_count,
            curator_score,
            curator_action,
            curator_reason,
            content_id
            `
        )
        .eq("id", boostId)
        .maybeSingle();

    if (error || !data) {
        throw new Error(
            `Unable to verify Boost: ${
                error?.message ?? "Boost not found"
            }`
        );
    }

    return data;
}

function revalidateBoost(boostId: string) {
    revalidatePath(`/content-ops/boosts/${boostId}`);
    revalidatePath("/content-ops/boosts");
    revalidatePath("/content-ops");
}

export async function updateBoostTitleFromContentOps(input: {
    boostId: string;
    workingTitle: string;
}) {
    const boostId = String(input?.boostId ?? "").trim();
    const workingTitle = String(input?.workingTitle ?? "")
        .trim()
        .replace(/\s+/g, " ");

    if (!boostId) {
        throw new Error("Boost ID is required.");
    }

    if (workingTitle.length < 3) {
        throw new Error(
            "Boost title must be at least 3 characters."
        );
    }

    if (workingTitle.length > 120) {
        throw new Error(
            "Boost title must be 120 characters or fewer."
        );
    }

    const admin = await requireContentOpsAdmin();
    const boost = await loadBoost(admin, boostId);

    if (boost.content_id) {
        throw new Error(
            "Boost title is locked after playable content has been created."
        );
    }

    if (
        String(boost.working_title ?? "").trim() ===
        workingTitle
    ) {
        return {
            success: true,
            workingTitle,
        };
    }

    const {
        data: updatedBoost,
        error: updateError,
    } = await admin
        .from("boosts")
        .update({
            working_title: workingTitle,
        })
        .eq("id", boostId)
        .is("content_id", null)
        .select("id, working_title, content_id")
        .maybeSingle();

    if (updateError) {
        console.error(
            "Boost title update error:",
            updateError
        );

        throw new Error(
            "Unable to save the Boost title."
        );
    }

    if (!updatedBoost) {
        throw new Error(
            "Boost title is no longer editable. Refresh the Boost and review its current production state."
        );
    }

    revalidateBoost(boostId);

    return {
        success: true,
        workingTitle: updatedBoost.working_title,
    };
}

export async function updateBoostFinalScriptFromContentOps(input: {
    boostId: string;
    finalScript: string;
}) {
    const boostId = String(input?.boostId ?? "").trim();
    const finalScript = String(input?.finalScript ?? "").trim();

    if (!boostId) {
        throw new Error("Boost ID is required.");
    }

    if (!finalScript) {
        throw new Error(
            "Final script cannot be empty."
        );
    }

    if (finalScript.length > 12000) {
        throw new Error(
            "Final script is too long to save."
        );
    }

    const admin = await requireContentOpsAdmin();
    const boost = await loadBoost(admin, boostId);

    if (
        boost.status !== "editor_approved" ||
        boost.curator_action ||
        boost.content_id
    ) {
        throw new Error(
            "Final script is editable only after Voice Editor approval and before Curator review."
        );
    }

    if (!boost.final_script?.trim()) {
        throw new Error(
            "This Boost does not contain an approved final script."
        );
    }

    if (boost.final_script.trim() === finalScript) {
        return {
            success: true,
            finalScript,
        };
    }

    const {
        data: updatedBoost,
        error: updateError,
    } = await admin
        .from("boosts")
        .update({
            final_script: finalScript,
        })
        .eq("id", boostId)
        .eq("status", "editor_approved")
        .is("curator_action", null)
        .is("content_id", null)
        .select(
            "id, status, final_script, curator_action, content_id"
        )
        .maybeSingle();

    if (updateError) {
        console.error(
            "Boost final script update error:",
            updateError
        );

        throw new Error(
            "Unable to save the final Boost script."
        );
    }

    if (!updatedBoost) {
        throw new Error(
            "Final script is no longer editable. Refresh the Boost and review its current production state."
        );
    }

    revalidateBoost(boostId);

    return {
        success: true,
        finalScript: updatedBoost.final_script,
    };
}

function resultForBoost(boost: any) {
    if (
        boost.status === "editor_approved" &&
        boost.final_script?.trim()
    ) {
        return {
            success: true,
            outcome: "approved" as const,
            status: boost.status,
            revisionCount: boost.revision_count,
        };
    }

    if (
        boost.status === "revision_needed" &&
        boost.editor_verdict === "REVISION NEEDED"
    ) {
        return {
            success: true,
            outcome: "revision_needed" as const,
            status: boost.status,
            revisionCount: boost.revision_count,
        };
    }

    if (boost.status === "human_safety_review") {
        return {
            success: true,
            outcome: "human_safety_review" as const,
            status: boost.status,
            revisionCount: boost.revision_count,
        };
    }

    throw new Error(
        `Boost stopped in unexpected creative status: ${boost.status}.`
    );
}

export async function createAndReviewBoostFromContentOps(input: {
    boostId: string;
}) {
    const boostId = String(input?.boostId ?? "").trim();

    if (!boostId) {
        throw new Error("Missing Boost.");
    }

    const admin = await requireContentOpsAdmin();

    let boost = await loadBoost(admin, boostId);

    if (boost.content_id) {
        throw new Error(
            "This Boost already has playable content connected. Creative automation is locked."
        );
    }

    if (boost.status === "human_safety_review") {
        revalidateBoost(boostId);

        return {
            success: true,
            outcome: "human_safety_review" as const,
            status: boost.status,
            revisionCount: boost.revision_count,
        };
    }

    /*
      Safe retry behavior:
      If Voice Editor already approved this Boost, do not rerun
      any creative agent.
    */
    if (
        boost.status === "editor_approved" &&
        boost.final_script?.trim()
    ) {
        revalidateBoost(boostId);
        return resultForBoost(boost);
    }

    /*
      Stage 1:
      An architected Boost has never been written.
    */
    if (boost.status === "architected") {
        if (
            boost.script_draft?.trim() ||
            boost.revised_script?.trim() ||
            boost.final_script?.trim()
        ) {
            throw new Error(
                "This architected Boost already contains script work. Automatic overwrite is disabled."
            );
        }

        if (!boost.architect_brief?.trim()) {
            throw new Error(
                "This Boost does not contain an Architect Brief."
            );
        }

        await callCreativeOrchestratorFromContentOps({
            action: "write_boost",
            boost_id: boostId,
        });

        boost = await loadBoost(admin, boostId);
    }

    /*
      Writer may itself raise a safety concern.
    */
    if (boost.status === "human_safety_review") {
        revalidateBoost(boostId);

        return {
            success: true,
            outcome: "human_safety_review" as const,
            status: boost.status,
            revisionCount: boost.revision_count,
        };
    }

    /*
      A drafted Boost may also arrive here after a prior Writer
      succeeded but Voice Editor review did not complete. In that
      case, do not rerun Writer; resume at review.
    */
    if (boost.status !== "drafted") {
        throw new Error(
            `Boost is not ready for Voice Editor review. Current status: ${boost.status}.`
        );
    }

    if (!boost.script_draft?.trim()) {
        throw new Error(
            "Drafted Boost does not contain a script draft."
        );
    }

    if (boost.final_script?.trim()) {
        throw new Error(
            "Drafted Boost already contains a final script. Automatic overwrite is disabled."
        );
    }

    /*
      Stage 2:
      Send this draft to its assigned Trusted Voice Editor.
    */
    await callCreativeOrchestratorFromContentOps({
        action: "review_boost",
        boost_id: boostId,
    });

    boost = await loadBoost(admin, boostId);

    revalidateBoost(boostId);

    return resultForBoost(boost);
}

export async function reviseAndReviewBoostFromContentOps(input: {
    boostId: string;
}) {
    const boostId = String(input?.boostId ?? "").trim();

    if (!boostId) {
        throw new Error("Missing Boost.");
    }

    const admin = await requireContentOpsAdmin();

    let boost = await loadBoost(admin, boostId);

    if (boost.content_id) {
        throw new Error(
            "This Boost already has playable content connected. Creative revision is locked."
        );
    }

    if (boost.status !== "revision_needed") {
        throw new Error(
            `Boost is not awaiting revision. Current status: ${boost.status}.`
        );
    }

    if (boost.editor_verdict !== "REVISION NEEDED") {
        throw new Error(
            `Boost does not have a REVISION NEEDED Voice Editor verdict. Current verdict: ${
                boost.editor_verdict ?? "missing"
            }.`
        );
    }

    if (!boost.script_draft?.trim()) {
        throw new Error(
            "Boost revision requires the rejected Writer draft."
        );
    }

    if (!boost.editor_notes?.trim()) {
        throw new Error(
            "Boost revision requires Voice Editor feedback."
        );
    }

    if (boost.final_script?.trim()) {
        throw new Error(
            "Boost already contains a final script. Automatic revision is disabled."
        );
    }

    /*
      Stage 1:
      Writer revises only this rejected Boost.
    */
    await callCreativeOrchestratorFromContentOps({
        action: "revise_boost",
        boost_id: boostId,
    });

    boost = await loadBoost(admin, boostId);

    /*
      Reviser may itself raise a safety concern.
    */
    if (boost.status === "human_safety_review") {
        revalidateBoost(boostId);

        return {
            success: true,
            outcome: "human_safety_review" as const,
            status: boost.status,
            revisionCount: boost.revision_count,
        };
    }

    if (boost.status !== "drafted") {
        throw new Error(
            `Boost revision stopped in unexpected status: ${boost.status}.`
        );
    }

    /*
      Stage 2:
      Re-review only the newly revised Boost.
    */
    await callCreativeOrchestratorFromContentOps({
        action: "review_boost",
        boost_id: boostId,
    });

    boost = await loadBoost(admin, boostId);

    revalidateBoost(boostId);

    return resultForBoost(boost);
}


function resultForCuratedBoost(boost: any) {
    if (boost.status === "pending_human_approval") {
        return {
            success: true,
            outcome: "pending_human_approval" as const,
            status: boost.status,
            curatorScore: boost.curator_score,
            curatorAction: boost.curator_action,
            curatorReason: boost.curator_reason,
        };
    }

    if (
        boost.status === "revision_needed" &&
        boost.curator_action === "SEND BACK FOR REVISION"
    ) {
        return {
            success: true,
            outcome: "curator_revision_needed" as const,
            status: boost.status,
            curatorScore: boost.curator_score,
            curatorAction: boost.curator_action,
            curatorReason: boost.curator_reason,
        };
    }

    if (
        boost.status === "revision_needed" &&
        boost.curator_action ===
            "REVISION NEEDED — WRONG TRUSTED VOICE FIT"
    ) {
        return {
            success: true,
            outcome: "wrong_trusted_voice_fit" as const,
            status: boost.status,
            curatorScore: boost.curator_score,
            curatorAction: boost.curator_action,
            curatorReason: boost.curator_reason,
        };
    }

    if (boost.status === "rejected") {
        return {
            success: true,
            outcome: "rejected" as const,
            status: boost.status,
            curatorScore: boost.curator_score,
            curatorAction: boost.curator_action,
            curatorReason: boost.curator_reason,
        };
    }

    if (boost.status === "human_safety_review") {
        return {
            success: true,
            outcome: "human_safety_review" as const,
            status: boost.status,
            curatorScore: boost.curator_score,
            curatorAction: boost.curator_action,
            curatorReason: boost.curator_reason,
        };
    }

    throw new Error(
        `Boost stopped in unexpected Curator status: ${boost.status}.`
    );
}

export async function curateBoostFromContentOps(input: {
    boostId: string;
    weekStart: string;
}) {
    const boostId = String(input?.boostId ?? "").trim();
    const weekStart = String(input?.weekStart ?? "").trim();

    if (!boostId) {
        throw new Error("Missing Boost.");
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
        throw new Error(
            "Curator review requires a valid week start in YYYY-MM-DD format."
        );
    }

    const admin = await requireContentOpsAdmin();
    let boost = await loadBoost(admin, boostId);

    if (boost.content_id) {
        throw new Error(
            "This Boost already has playable content connected. Curator review is locked."
        );
    }

    if (
        boost.curator_action &&
        [
            "pending_human_approval",
            "revision_needed",
            "rejected",
            "human_safety_review",
        ].includes(boost.status)
    ) {
        revalidateBoost(boostId);
        return resultForCuratedBoost(boost);
    }

    if (boost.status !== "editor_approved") {
        throw new Error(
            `Boost is not ready for Curator review. Current status: ${boost.status}.`
        );
    }

    if (!boost.final_script?.trim()) {
        throw new Error(
            "Curator review requires a Voice-Editor-approved final script."
        );
    }

    await callCreativeOrchestratorFromContentOps({
        action: "curate_boost_for_recording",
        boost_id: boostId,
        week_start: weekStart,
    });

    boost = await loadBoost(admin, boostId);
    revalidateBoost(boostId);

    return resultForCuratedBoost(boost);
}

export async function reviseCuratorBoostAndReviewFromContentOps(input: {
    boostId: string;
}) {
    const boostId = String(input?.boostId ?? "").trim();

    if (!boostId) {
        throw new Error("Missing Boost.");
    }

    const admin = await requireContentOpsAdmin();
    let boost = await loadBoost(admin, boostId);

    if (boost.content_id) {
        throw new Error(
            "This Boost already has playable content connected. Creative revision is locked."
        );
    }

    if (boost.status !== "revision_needed") {
        throw new Error(
            `Boost is not awaiting Curator revision. Current status: ${boost.status}.`
        );
    }

    if (
        boost.curator_action ===
        "REVISION NEEDED — WRONG TRUSTED VOICE FIT"
    ) {
        throw new Error(
            "Curator determined that the Trusted Voice fit is wrong. Automatic same-voice revision is disabled."
        );
    }

    if (boost.curator_action !== "SEND BACK FOR REVISION") {
        throw new Error(
            `Boost does not have a Curator SEND BACK FOR REVISION action. Current action: ${
                boost.curator_action ?? "missing"
            }.`
        );
    }

    if (!boost.curator_reason?.trim()) {
        throw new Error(
            "Curator revision requires Curator feedback."
        );
    }

    if (!boost.final_script?.trim()) {
        throw new Error(
            "Curator revision requires the previously approved final script."
        );
    }

    if (
        !["APPROVED", "APPROVED WITH MINOR EDITS"].includes(
            boost.editor_verdict ?? ""
        )
    ) {
        throw new Error(
            `Curator revision requires a prior approved Voice Editor verdict. Current verdict: ${
                boost.editor_verdict ?? "missing"
            }.`
        );
    }

    await callCreativeOrchestratorFromContentOps({
        action: "revise_boost_from_curator",
        boost_id: boostId,
    });

    boost = await loadBoost(admin, boostId);

    if (boost.status === "human_safety_review") {
        revalidateBoost(boostId);

        return {
            success: true,
            outcome: "human_safety_review" as const,
            status: boost.status,
            revisionCount: boost.revision_count,
        };
    }

    if (boost.status !== "drafted") {
        throw new Error(
            `Curator revision stopped in unexpected status: ${boost.status}.`
        );
    }

    if (!boost.script_draft?.trim()) {
        throw new Error(
            "Curator-revised Boost does not contain a new Writer draft."
        );
    }

    if (boost.final_script?.trim()) {
        throw new Error(
            "Curator-revised Boost unexpectedly still contains a final script."
        );
    }

    await callCreativeOrchestratorFromContentOps({
        action: "review_boost",
        boost_id: boostId,
    });

    boost = await loadBoost(admin, boostId);
    revalidateBoost(boostId);

    return resultForBoost(boost);
}



export async function approveBoostForRecordingFromContentOps(input: {
    boostId: string;
}) {
    const boostId = String(input?.boostId ?? "").trim();

    if (!boostId) {
        throw new Error("Missing Boost.");
    }

    const admin = await requireContentOpsAdmin();
    let boost = await loadBoost(admin, boostId);

    /*
      Safe retry behavior.

      If the human approval already completed, do not
      attempt to create another human decision.
    */
    if (boost.status === "human_approved") {
        revalidateBoost(boostId);

        return {
            success: true,
            outcome: "human_approved" as const,
            status: boost.status,
        };
    }

    if (boost.content_id) {
        throw new Error(
            "This Boost already has playable content connected. Human recording approval is locked."
        );
    }

    if (boost.status !== "pending_human_approval") {
        throw new Error(
            `Boost is not waiting for human recording approval. Current status: ${boost.status}.`
        );
    }

    if (!boost.final_script?.trim()) {
        throw new Error(
            "Human recording approval requires the approved final script."
        );
    }

    /*
      APPROVE AFTER MICRO-EDITS is intentionally not
      approved here yet.

      That Curator action needs its own explicit Boost
      micro-edit workflow before the human approval gate.
    */
    if (boost.curator_action !== "APPROVE FOR RECORDING") {
        throw new Error(
            `This Boost cannot be human-approved through this control. Curator action: ${
                boost.curator_action ?? "missing"
            }.`
        );
    }

    /*
      A Boost should have exactly one current undecided
      Curator slate item.

      Resolve it server-side rather than accepting a
      browser-supplied slate-item ID.
    */
    const {
        data: slateItems,
        error: slateItemsError,
    } = await admin
        .from("weekly_slate_items")
        .select(
            `
            id,
            boost_id,
            curator_action,
            human_decision
            `
        )
        .eq("boost_id", boostId)
        .is("human_decision", null)
        .limit(2);

    if (slateItemsError) {
        throw new Error(
            `Unable to verify the current Curator recommendation: ${slateItemsError.message}`
        );
    }

    if (!slateItems || slateItems.length !== 1) {
        throw new Error(
            `Expected exactly one undecided Curator recommendation for this Boost, but found ${
                slateItems?.length ?? 0
            }.`
        );
    }

    const slateItem = slateItems[0];

    if (
        slateItem.curator_action !==
        "APPROVE FOR RECORDING"
    ) {
        throw new Error(
            `The current Curator slate item is not eligible for this approval control. Curator action: ${
                slateItem.curator_action ?? "missing"
            }.`
        );
    }

    if (
        slateItem.curator_action !==
        boost.curator_action
    ) {
        throw new Error(
            "The Boost and its current Curator slate item no longer agree. Human approval stopped."
        );
    }

    /*
      IMPORTANT:

      Do not directly update boosts here.

      The existing backend approval RPC owns the
      human-approval state transition.
    */
    await callCreativeOrchestratorFromContentOps({
        action: "approve_slate_item",
        weekly_slate_item_id: slateItem.id,
        human_notes:
            "Human approval completed in Content Ops after reviewing the Curator recommendation and final approved Boost script.",
    });

    /*
      Confirm the source Boost actually advanced.
    */
    boost = await loadBoost(admin, boostId);

    if (boost.status !== "human_approved") {
        throw new Error(
            `Boost approval returned successfully, but the Boost did not reach human_approved. Current status: ${boost.status}.`
        );
    }

    revalidateBoost(boostId);

    return {
        success: true,
        outcome: "human_approved" as const,
        status: boost.status,
    };
}



export async function reviewBoostRecordingRewriteFromContentOps(input: {
    boostId: string;
}) {
    const boostId = String(input?.boostId ?? "").trim();

    if (!boostId) {
        throw new Error("Missing Boost.");
    }

    const admin = await requireContentOpsAdmin();
    let boost = await loadBoost(admin, boostId);

    if (boost.content_id) {
        throw new Error(
            "This Boost already has playable content connected. Recording rewrite review is locked."
        );
    }

    if (!boost.recording_script?.trim()) {
        throw new Error(
            "Save the recording rewrite before sending it for review."
        );
    }

    if (
        boost.status !== "human_approved" &&
        boost.status !== "revision_needed"
    ) {
        throw new Error(
            `Recording rewrite review is not available at Boost status ${boost.status}.`
        );
    }

    await callCreativeOrchestratorFromContentOps({
        action: "review_boost_recording_rewrite",
        boost_id: boostId,
    });

    boost = await loadBoost(admin, boostId);

    revalidateBoost(boostId);

    return resultForBoost(boost);
}


export async function saveBoostRecordingScript(formData: FormData) {
    const boostId = String(
        formData.get("boost_id") ?? ""
    ).trim();

    const recordingScript = String(
        formData.get("recording_script") ?? ""
    )
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n");

    if (!boostId) {
        throw new Error("Missing Boost.");
    }

    if (!recordingScript.trim()) {
        throw new Error(
            "Recording script cannot be empty."
        );
    }

    const admin = await requireContentOpsAdmin();

    const {
        data: boost,
        error: boostError,
    } = await admin
        .from("boosts")
        .select(
            `
            id,
            status,
            content_id,
            final_script,
            recording_script
            `
        )
        .eq("id", boostId)
        .maybeSingle();

    if (boostError) {
        throw new Error(
            "Unable to verify Boost."
        );
    }

    if (!boost) {
        throw new Error(
            "Boost not found."
        );
    }

    /*
      Recording copy is a post-human-approval
      production artifact.

      Creative approval history remains unchanged.
    */
    const isRecordingRewriteRevision =
        boost.status === "revision_needed" &&
        Boolean(boost.recording_script?.trim());

    if (
        boost.status !== "human_approved" &&
        !isRecordingRewriteRevision
    ) {
        throw new Error(
            `Recording script is locked at Boost status ${
                boost.status ?? "unknown"
            }.`
        );
    }

    if (!boost.final_script?.trim()) {
        throw new Error(
            "Recording script requires an approved final script."
        );
    }

    if (boost.content_id) {
        throw new Error(
            "Recording script is locked after playable content has been connected."
        );
    }

    const {
        data: updatedBoost,
        error: updateError,
    } = await admin
        .from("boosts")
        .update({
            recording_script:
                recordingScript,
        })
        .eq("id", boostId)
        .in(
            "status",
            [
                "human_approved",
                "revision_needed",
            ]
        )
        .is("content_id", null)
        .select(
            "id, status, content_id, recording_script"
        )
        .maybeSingle();

    if (updateError) {
        console.error(
            "Boost recording script save error:",
            updateError
        );

        throw new Error(
            "Unable to save Boost recording script."
        );
    }

    if (!updatedBoost) {
        throw new Error(
            "Recording script is no longer editable. Refresh the Boost and review its current production state."
        );
    }

    if (
        ![
            "human_approved",
            "revision_needed",
        ].includes(updatedBoost.status) ||
        updatedBoost.content_id
    ) {
        throw new Error(
            "Boost production state changed while the recording script was being saved."
        );
    }

    revalidateBoost(boostId);

    redirect(
        `/content-ops/boosts/${boostId}?recording=saved`
    );
}



function slugifyBoostAudioFilenamePart(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

async function getNewBoostAudioTarget(
    admin: any,
    boostId: string
) {
    const {
        data: boost,
        error: boostError,
    } = await admin
        .from("boosts")
        .select(
            `
            id,
            working_title,
            slug,
            boost_format,
            trusted_voice,
            mindset_feeling_id,
            status,
            final_script,
            recording_script,
            content_id
            `
        )
        .eq("id", boostId)
        .maybeSingle();

    if (boostError || !boost) {
        throw new Error(
            `Unable to verify Boost: ${
                boostError?.message ??
                "Boost not found"
            }`
        );
    }

    /*
      Audio upload begins only after the explicit
      human-approved creative checkpoint.
    */
    if (boost.status !== "human_approved") {
        throw new Error(
            `Finished Boost audio is locked at status ${
                boost.status ?? "unknown"
            }.`
        );
    }

    if (boost.content_id) {
        throw new Error(
            "This Boost already has playable content connected."
        );
    }

    if (!boost.final_script?.trim()) {
        throw new Error(
            "Finished Boost audio requires an approved final script."
        );
    }

    if (!boost.recording_script?.trim()) {
        throw new Error(
            "Finalize and save the recording script before uploading finished audio."
        );
    }

    if (!boost.working_title?.trim()) {
        throw new Error(
            "Boost is missing its working title."
        );
    }

    if (
        ![
            "affirmation",
            "story",
            "meditation",
        ].includes(boost.boost_format ?? "")
    ) {
        throw new Error(
            "Boost format is not valid for playable content."
        );
    }

    const boostSlug =
        String(boost.slug ?? "").trim();

    if (
        !boostSlug ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
            boostSlug
        )
    ) {
        throw new Error(
            "Boost slug is not valid for the production audio filename."
        );
    }

    const trustedVoiceLookup =
        String(boost.trusted_voice ?? "")
            .trim()
            .toLowerCase();

    if (!trustedVoiceLookup) {
        throw new Error(
            "Boost is missing its Trusted Voice."
        );
    }

    /*
      Resolve one active Trusted Voice by canonical
      name or established nickname.

      The canonical voice name is always used in the
      production filename.
    */
    const {
        data: activeVoices,
        error: voiceError,
    } = await admin
        .from("trusted_voices")
        .select(
            "id, name, nickname, trusted_voice_status"
        )
        .eq(
            "trusted_voice_status",
            "active"
        );

    if (voiceError) {
        throw new Error(
            "Unable to verify the Boost Trusted Voice."
        );
    }

    const matchingVoices = (
        activeVoices ?? []
    ).filter((voice: any) => {
        const canonicalName =
            String(voice.name ?? "")
                .trim()
                .toLowerCase();

        const nickname =
            String(voice.nickname ?? "")
                .trim()
                .toLowerCase();

        return (
            canonicalName ===
                trustedVoiceLookup ||
            (
                Boolean(nickname) &&
                nickname ===
                    trustedVoiceLookup
            )
        );
    });

    if (matchingVoices.length !== 1) {
        throw new Error(
            matchingVoices.length === 0
                ? "Boost Trusted Voice did not resolve to an active Trusted Voice."
                : "Boost Trusted Voice resolved to more than one active Trusted Voice."
        );
    }

    const trustedVoice =
        matchingVoices[0];

    const canonicalVoiceName =
        String(trustedVoice.name ?? "")
            .trim();

    const voiceSlug =
        slugifyBoostAudioFilenamePart(
            canonicalVoiceName
        );

    if (!voiceSlug) {
        throw new Error(
            "Unable to generate the Trusted Voice audio filename segment."
        );
    }

    if (!boost.mindset_feeling_id) {
        throw new Error(
            "Boost is missing its Mindset Feeling."
        );
    }

    const {
        data: mindsetFeeling,
        error: feelingError,
    } = await admin
        .from("mindset_feelings")
        .select("id, slug")
        .eq(
            "id",
            boost.mindset_feeling_id
        )
        .maybeSingle();

    if (
        feelingError ||
        !mindsetFeeling
    ) {
        throw new Error(
            "Unable to resolve the Boost Mindset Feeling."
        );
    }

    const feelingSlug =
        String(
            mindsetFeeling.slug ?? ""
        ).trim();

    if (
        !feelingSlug ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
            feelingSlug
        )
    ) {
        throw new Error(
            "Mindset Feeling slug is not valid for the production audio filename."
        );
    }

    /*
      Established standalone Boost convention:

      boost__<mindset-feeling>__<boost>__<voice>.mp3
    */
    const storageObjectName =
        `boost__${feelingSlug}` +
        `__${boostSlug}` +
        `__${voiceSlug}.mp3`;

    return {
        boost,
        trustedVoice,
        mindsetFeeling,
        storageObjectName,
    };
}

export async function createBoostAudioUploadTicket(input: {
    boostId: string;
    originalFileName: string;
    fileSize: number;
}) {
    const boostId =
        String(input?.boostId ?? "").trim();

    const originalFileName =
        String(
            input?.originalFileName ?? ""
        ).trim();

    const fileSize =
        Number(input?.fileSize);

    if (!boostId) {
        throw new Error("Missing Boost.");
    }

    if (!originalFileName) {
        throw new Error(
            "Missing audio filename."
        );
    }

    if (
        !originalFileName
            .toLowerCase()
            .endsWith(".mp3")
    ) {
        throw new Error(
            "Finished Boost audio must be an MP3 file."
        );
    }

    if (
        !Number.isInteger(fileSize) ||
        fileSize <= 0 ||
        fileSize > 50 * 1024 * 1024
    ) {
        throw new Error(
            "Audio file must be larger than 0 bytes and no larger than 50 MB."
        );
    }

    const admin =
        await requireContentOpsAdmin();

    const {
        storageObjectName,
    } = await getNewBoostAudioTarget(
        admin,
        boostId
    );

    /*
      The browser receives a signed ticket for only
      the server-computed canonical object.

      upsert:false prevents this workflow from silently
      replacing an existing production MP3.
    */
    const {
        data,
        error,
    } = await admin.storage
        .from("audio")
        .createSignedUploadUrl(
            storageObjectName,
            {
                upsert: false,
            }
        );

    if (error) {
        console.error(
            "Boost signed upload ticket error:",
            error
        );

        throw new Error(
            "Unable to prepare the Boost audio upload."
        );
    }

    if (!data?.token) {
        throw new Error(
            "Supabase did not return an audio upload token."
        );
    }

    return {
        storageObjectName,
        token: data.token,
    };
}



export async function discoverBoostUploadedAudio(input: {
    boostId: string;
}) {
    const boostId =
        String(input?.boostId ?? "").trim();

    if (!boostId) {
        throw new Error("Missing Boost.");
    }

    const admin =
        await requireContentOpsAdmin();

    /*
      Re-derive the canonical production target from
      current authoritative Boost metadata.

      This keeps Storage discovery independent of
      browser state or a previously returned ticket.
    */
    const {
        storageObjectName,
    } = await getNewBoostAudioTarget(
        admin,
        boostId
    );

    const {
        data: storedObjects,
        error: storageError,
    } = await admin.storage
        .from("audio")
        .list("", {
            limit: 100,
            search: storageObjectName,
        });

    if (storageError) {
        console.error(
            "Boost audio discovery error:",
            storageError
        );

        throw new Error(
            "Unable to check Boost audio Storage."
        );
    }

    const uploadedObject =
        storedObjects?.find(
            (object: any) =>
                object.name ===
                storageObjectName
        ) ?? null;

    let publicUrl: string | null = null;

    if (uploadedObject) {
        const {
            data: publicUrlData,
        } = admin.storage
            .from("audio")
            .getPublicUrl(
                storageObjectName
            );

        publicUrl =
            publicUrlData?.publicUrl ??
            null;

        if (!publicUrl) {
            throw new Error(
                "Unable to resolve the stored Boost audio URL."
            );
        }
    }

    return {
        storageObjectName,
        exists: Boolean(uploadedObject),
        publicUrl,
    };
}


export async function finalizeBoostAudioUpload(input: {
    boostId: string;
    storageObjectName: string;
    durationSeconds: number;
}) {
    const boostId =
        String(input?.boostId ?? "").trim();

    const storageObjectName =
        String(
            input?.storageObjectName ?? ""
        ).trim();

    const durationSeconds =
        Number(input?.durationSeconds);

    if (
        !boostId ||
        !storageObjectName
    ) {
        throw new Error(
            "Missing Boost or uploaded audio."
        );
    }

    if (
        !Number.isInteger(durationSeconds) ||
        durationSeconds <= 0 ||
        durationSeconds > 7200
    ) {
        throw new Error(
            "Audio duration is invalid."
        );
    }

    const admin =
        await requireContentOpsAdmin();

    /*
      Recompute the authoritative target immediately
      before connection.

      Browser state is never trusted to choose which
      Storage object becomes playable content.
    */
    const {
        storageObjectName:
            expectedStorageObjectName,
    } = await getNewBoostAudioTarget(
        admin,
        boostId
    );

    if (
        storageObjectName !==
        expectedStorageObjectName
    ) {
        throw new Error(
            "Uploaded audio filename does not match the expected Boost production filename."
        );
    }

    /*
      Verify that the exact canonical MP3 still exists
      in the established standalone audio bucket.
    */
    const {
        data: storedObjects,
        error: storageError,
    } = await admin.storage
        .from("audio")
        .list("", {
            limit: 100,
            search: storageObjectName,
        });

    if (storageError) {
        console.error(
            "Boost audio verification error:",
            storageError
        );

        throw new Error(
            "Unable to verify the uploaded Boost audio."
        );
    }

    const uploadedObject =
        storedObjects?.find(
            (object: any) =>
                object.name ===
                storageObjectName
        );

    if (!uploadedObject) {
        throw new Error(
            "The uploaded MP3 could not be found in Boost audio Storage."
        );
    }

    /*
      Generate the playable URL on the trusted server
      rather than accepting a URL from the browser.
    */
    const {
        data: { publicUrl },
    } = admin.storage
        .from("audio")
        .getPublicUrl(
            storageObjectName
        );

    if (!publicUrl) {
        throw new Error(
            "Unable to generate the Boost audio URL."
        );
    }

    /*
      This is the explicit production connection
      boundary.

      The RPC creates dormant content and moves the
      creative Boost to recorded. It does NOT release
      or activate the content.
    */
    const {
        data: result,
        error: rpcError,
    } = await admin.rpc(
        "complete_boost_recording",
        {
            p_boost_id:
                boostId,
            p_storage_object_name:
                storageObjectName,
            p_audio_url:
                publicUrl,
            p_duration_seconds:
                durationSeconds,
        }
    );

    if (rpcError) {
        console.error(
            "Boost recording completion error:",
            rpcError
        );

        throw new Error(
            rpcError.message
        );
    }

    revalidateBoost(boostId);

    return {
        success: true,
        storageObjectName,
        result,
    };
}


/*
  Explicit standalone Boost release boundary.

  This action is intentionally separate from finished-audio
  connection. The linked content must already exist in its
  dormant recorded state.

  The database RPC is the authoritative release gate.
*/
export async function releaseBoostFromContentOps(input: {
    boostId: string;
}) {
    const boostId =
        String(input?.boostId ?? "").trim();

    if (!boostId) {
        throw new Error("Missing Boost.");
    }

    const admin =
        await requireContentOpsAdmin();

    /*
      Confirm the browser is asking to release the exact
      production state we expect.

      These checks improve the Content Ops error message.
      The release_boost RPC independently revalidates and
      locks the authoritative database state.
    */
    const boost =
        await loadBoost(admin, boostId);

    if (boost.status !== "recorded") {
        throw new Error(
            `Boost cannot be released from status ${
                boost.status ?? "unknown"
            }. Expected recorded.`
        );
    }

    if (!boost.content_id) {
        throw new Error(
            "Recorded Boost has no playable content connected."
        );
    }

    const {
        data: content,
        error: contentError,
    } = await admin
        .from("content")
        .select(
            `
            id,
            is_active,
            published_at,
            unpublished_at,
            editor_status,
            production_status,
            audio_url,
            duration_seconds
            `
        )
        .eq("id", boost.content_id)
        .maybeSingle();

    if (contentError) {
        console.error(
            "Boost release content verification error:",
            contentError
        );

        throw new Error(
            "Unable to verify the Boost's playable content."
        );
    }

    if (!content) {
        throw new Error(
            "The Boost's linked playable content could not be found."
        );
    }

    if (content.is_active) {
        throw new Error(
            "This Boost's content is already active. Investigate before attempting release."
        );
    }

    if (content.published_at) {
        throw new Error(
            "This Boost's content already has a publication timestamp. Investigate before attempting release."
        );
    }

    if (content.unpublished_at) {
        throw new Error(
            "This Boost's content has previously been unpublished. First-release is blocked."
        );
    }

    if (
        content.editor_status !== "approved" ||
        content.production_status !== "ready"
    ) {
        throw new Error(
            "Playable content is not in the approved/ready production state."
        );
    }

    if (
        !content.audio_url?.trim() ||
        !Number.isInteger(content.duration_seconds) ||
        content.duration_seconds <= 0 ||
        content.duration_seconds > 7200
    ) {
        throw new Error(
            "Playable content does not have valid finished audio."
        );
    }

    /*
      RELEASE.

      release_boost() atomically:
      - activates the standalone content
      - sets published_at
      - moves the Boost from recorded to published

      content.is_active=true is the listener-visible edge.
    */
    const {
        data: result,
        error: rpcError,
    } = await admin.rpc(
        "release_boost",
        {
            p_boost_id: boostId,
        }
    );

    if (rpcError) {
        console.error(
            "Boost release error:",
            rpcError
        );

        throw new Error(
            rpcError.message
        );
    }

    /*
      Once release_boost() returns without an RPC error,
      the database transaction has committed.

      Do not turn a successful listener-facing release into
      an apparent failure by depending on additional reads
      after that commit. Database verification will be done
      independently during production validation.
    */
    revalidateBoost(boostId);

    return {
        success: true,
        outcome: "published" as const,
        boostId,
        contentId: boost.content_id,
        result,
    };
}
