"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "../../../../lib/supabase/admin";
import { createClient } from "../../../../lib/supabase/server";

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

    if (!adminEmail || userEmail !== adminEmail) {
        throw new Error("Not authorized.");
    }

    return createAdminClient();
}

export async function saveRecordingScript(formData: FormData) {
    const journeyId = String(formData.get("journey_id") ?? "");
    const stepId = String(formData.get("step_id") ?? "");

    const recordingScript = String(
        formData.get("recording_script") ?? ""
    )
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n");

    if (!journeyId || !stepId) {
        throw new Error("Missing Journey or step.");
    }

    if (!recordingScript.trim()) {
        throw new Error("Recording script cannot be empty.");
    }

    const admin = await requireContentOpsAdmin();

    const { data: step, error: stepError } = await admin
        .from("journey_steps")
        .select("id, journey_id, status, content_id")
        .eq("id", stepId)
        .eq("journey_id", journeyId)
        .maybeSingle();

    if (stepError) {
        throw new Error("Unable to verify Journey step.");
    }

    if (!step) {
        throw new Error("Journey step not found.");
    }

    const recordingScriptEditableStatuses =
        new Set([
            "editor_approved",
            "pending_human_approval",
        ]);

    if (
        !step.status ||
        !recordingScriptEditableStatuses.has(
            step.status
        )
    ) {
        throw new Error(
            `Recording script is locked at step status ${step.status ?? "unknown"}.`
        );
    }

    if (step.content_id) {
        throw new Error(
            "Recording script is locked after audio content has been connected."
        );
    }

    const { data: journey, error: journeyError } = await admin
        .from("journeys")
        .select("id, pipeline_purpose, is_active")
        .eq("id", journeyId)
        .maybeSingle();

    if (journeyError || !journey) {
        throw new Error("Unable to verify Journey.");
    }

    if (journey.pipeline_purpose !== "production") {
        throw new Error("Only production Journeys can be edited.");
    }

    if (journey.is_active) {
        throw new Error(
            "Recording scripts cannot be changed from Content Ops after a Journey is live."
        );
    }

    const {
        data: updatedStep,
        error: updateError,
    } = await admin
        .from("journey_steps")
        .update({
            recording_script: recordingScript,
        })
        .eq("id", stepId)
        .eq("journey_id", journeyId)
        .in("status", [
            "editor_approved",
            "pending_human_approval",
        ])
        .is("content_id", null)
        .select("id")
        .maybeSingle();

    if (updateError) {
        console.error("Recording script save error:", updateError);
        throw new Error("Unable to save recording script.");
    }

    if (!updatedStep) {
        throw new Error(
            "Recording script is no longer editable. Refresh the Journey and review its current production state."
        );
    }

    revalidatePath(`/content-ops/journeys/${journeyId}`);
    revalidatePath("/content-ops");

    redirect(
        `/content-ops/journeys/${journeyId}?saved=${encodeURIComponent(stepId)}`
    );
}

export async function connectLegacyAudio(formData: FormData) {
    const journeyId = String(formData.get("journey_id") ?? "");
    const stepId = String(formData.get("step_id") ?? "");
    const storageObjectName = String(
        formData.get("storage_object_name") ?? ""
    ).trim();

    const durationSeconds = Number(
        formData.get("duration_seconds")
    );

    if (!journeyId || !stepId || !storageObjectName) {
        throw new Error("Missing Journey, step, or audio file.");
    }

    if (
        !Number.isInteger(durationSeconds) ||
        durationSeconds <= 0 ||
        durationSeconds > 7200
    ) {
        throw new Error("Audio duration is invalid.");
    }



    const admin = await requireContentOpsAdmin();

    /*
      Confirm the step belongs to the Journey shown in Content Ops.
    */
    const { data: step, error: stepError } = await admin
        .from("journey_steps")
        .select("id, journey_id, content_id")
        .eq("id", stepId)
        .eq("journey_id", journeyId)
        .maybeSingle();

    if (stepError) {
        throw new Error("Unable to verify Journey step.");
    }

    if (!step) {
        throw new Error("Journey step not found.");
    }

    if (step.content_id) {
        throw new Error("This Journey step already has audio connected.");
    }

    /*
      Generate the public URL on the trusted server.
      The browser never supplies or chooses the audio URL.
    */
    const {
        data: { publicUrl },
    } = admin.storage
        .from("Journeys Audio")
        .getPublicUrl(storageObjectName);

    if (!publicUrl) {
        throw new Error("Unable to generate Journey audio URL.");
    }

    /*
      The database RPC performs the final guarded creation/link.
    */
    const { error: rpcError } = await admin.rpc(
        "attach_existing_journey_audio",
        {
            p_journey_step_id: stepId,
            p_storage_object_name: storageObjectName,
            p_audio_url: publicUrl,
            p_duration_seconds: durationSeconds,
        }
    );

    if (rpcError) {
        console.error("Legacy Journey audio connection error:", rpcError);
        throw new Error(rpcError.message);
    }

    revalidatePath(`/content-ops/journeys/${journeyId}`);
    revalidatePath("/content-ops");

    redirect(
        `/content-ops/journeys/${journeyId}?audioConnected=${encodeURIComponent(
            stepId
        )}`
    );
}

function slugifyAudioFilenamePart(value: string) {
    return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[’']/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
}

async function getNewProductionAudioTarget(
    admin: Awaited<ReturnType<typeof requireContentOpsAdmin>>,
    journeyId: string,
    stepId: string
) {
    const { data: step, error: stepError } = await admin
        .from("journey_steps")
        .select(
            "id, journey_id, step_number, title, status, content_id, final_script, recording_script"
        )
        .eq("id", stepId)
        .eq("journey_id", journeyId)
        .maybeSingle();

    if (stepError) {
        throw new Error("Unable to verify Journey step.");
    }

    if (!step) {
        throw new Error("Journey step not found.");
    }

    const { data: journey, error: journeyError } = await admin
        .from("journeys")
        .select(
            "id, title, status, is_active, pipeline_purpose"
        )
        .eq("id", journeyId)
        .maybeSingle();

    if (journeyError || !journey) {
        throw new Error("Unable to verify Journey.");
    }

    if (journey.pipeline_purpose !== "production") {
        throw new Error(
            "Only production Journeys can receive production audio."
        );
    }

    if (journey.is_active) {
        throw new Error(
            "Audio cannot be changed from Content Ops after a Journey is live."
        );
    }

    const productionAudioStatuses = [
        "in_production",
        "coherence_approved",
    ];

    if (!productionAudioStatuses.includes(journey.status)) {
        throw new Error(
            `Journey is not in an eligible production state for audio. Current status: ${journey.status}.`
        );
    }

    if (step.status !== "human_approved") {
        throw new Error(
            `New production audio requires a human-approved Journey step. Current status: ${step.status}.`
        );
    }

    if (step.content_id) {
        throw new Error(
            "This Journey step already has finished audio connected."
        );
    }

    if (!step.final_script?.trim()) {
        throw new Error(
            "This Journey step is missing its approved final script."
        );
    }

    if (!step.recording_script?.trim()) {
        throw new Error(
            "Finalize the recording script before uploading finished audio."
        );
    }

    const journeySlug =
        slugifyAudioFilenamePart(journey.title);

    const stepSlug =
        slugifyAudioFilenamePart(step.title);

    if (!journeySlug || !stepSlug) {
        throw new Error(
            "Unable to generate the standard Journey audio filename."
        );
    }

    const storageObjectName =
        `journey_${journeySlug}_day-${step.step_number}_${stepSlug}.mp3`;

    return {
        step,
        journey,
        storageObjectName,
    };
}

export async function createJourneyAudioUploadTicket(input: {
    journeyId: string;
    stepId: string;
    originalFileName: string;
    fileSize: number;
}) {
    const journeyId = String(input?.journeyId ?? "");
    const stepId = String(input?.stepId ?? "");
    const originalFileName =
        String(input?.originalFileName ?? "").trim();
    const fileSize = Number(input?.fileSize);

    if (!journeyId || !stepId) {
        throw new Error("Missing Journey or step.");
    }

    if (!originalFileName) {
        throw new Error("Missing audio filename.");
    }

    if (!originalFileName.toLowerCase().endsWith(".mp3")) {
        throw new Error(
            "Finished Journey audio must be an MP3 file."
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

    const admin = await requireContentOpsAdmin();

    const { storageObjectName } =
        await getNewProductionAudioTarget(
            admin,
            journeyId,
            stepId
        );

    const { data, error } = await admin.storage
        .from("Journeys Audio")
        .createSignedUploadUrl(
            storageObjectName,
            {
                upsert: false,
            }
        );

    if (error) {
        console.error(
            "Journey signed upload ticket error:",
            error
        );

        throw new Error(
            "Unable to prepare the Journey audio upload."
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

export async function finalizeJourneyAudioUpload(input: {
    journeyId: string;
    stepId: string;
    storageObjectName: string;
    durationSeconds: number;
}) {
    const journeyId = String(input?.journeyId ?? "");
    const stepId = String(input?.stepId ?? "");
    const storageObjectName =
        String(input?.storageObjectName ?? "").trim();
    const durationSeconds =
        Number(input?.durationSeconds);

    if (
        !journeyId ||
        !stepId ||
        !storageObjectName
    ) {
        throw new Error(
            "Missing Journey, step, or uploaded audio."
        );
    }

    if (
        !Number.isInteger(durationSeconds) ||
        durationSeconds <= 0 ||
        durationSeconds > 7200
    ) {
        throw new Error("Audio duration is invalid.");
    }

    const admin = await requireContentOpsAdmin();

    const {
        storageObjectName: expectedStorageObjectName,
    } = await getNewProductionAudioTarget(
        admin,
        journeyId,
        stepId
    );

    if (
        storageObjectName !==
        expectedStorageObjectName
    ) {
        throw new Error(
            "Uploaded audio filename does not match the expected Journey filename."
        );
    }

    const {
        data: storedObjects,
        error: storageError,
    } = await admin.storage
        .from("Journeys Audio")
        .list("", {
            limit: 100,
            search: storageObjectName,
        });

    if (storageError) {
        console.error(
            "Journey audio verification error:",
            storageError
        );

        throw new Error(
            "Unable to verify the uploaded Journey audio."
        );
    }

    const uploadedObject =
        storedObjects?.find(
            (object) =>
                object.name === storageObjectName
        );

    if (!uploadedObject) {
        throw new Error(
            "The uploaded MP3 could not be found in Journey Storage."
        );
    }

    const {
        data: { publicUrl },
    } = admin.storage
        .from("Journeys Audio")
        .getPublicUrl(storageObjectName);

    if (!publicUrl) {
        throw new Error(
            "Unable to generate the Journey audio URL."
        );
    }

    const { data: result, error: rpcError } =
        await admin.rpc(
            "complete_journey_step_recording",
            {
                p_journey_step_id: stepId,
                p_audio_url: publicUrl,
                p_duration_seconds:
                    durationSeconds,
            }
        );

    if (rpcError) {
        console.error(
            "Journey recording completion error:",
            rpcError
        );

        throw new Error(rpcError.message);
    }

    revalidatePath(
        `/content-ops/journeys/${journeyId}`
    );
    revalidatePath("/content-ops");

    return {
        success: true,
        storageObjectName,
        result,
    };
}

type JourneyImageAssetType = "cover" | "hero";

function getJourneyImageAssetConfig(
    assetType: JourneyImageAssetType
) {
    if (assetType === "cover") {
        return {
            bucket: "journey-cover-image",
            label: "cover",
        };
    }

    return {
        bucket: "journey-heroes",
        label: "hero",
    };
}

function getJourneyImageExtension(mimeType: string) {
    switch (mimeType) {
        case "image/jpeg":
            return "jpg";

        case "image/png":
            return "png";

        case "image/webp":
            return "webp";

        default:
            throw new Error(
                "Journey images must be JPEG, PNG, or WebP."
            );
    }
}

async function getNewProductionImageTarget(
    admin: Awaited<
        ReturnType<typeof requireContentOpsAdmin>
    >,
    journeyId: string,
    assetType: JourneyImageAssetType,
    mimeType: string
) {
    const { data: journey, error: journeyError } =
        await admin
            .from("journeys")
            .select(
                "id, title, pipeline_purpose, status, is_active, cover_image_url, hero_image_url"
            )
            .eq("id", journeyId)
            .maybeSingle();

    if (journeyError || !journey) {
        throw new Error("Unable to verify Journey.");
    }

    if (journey.pipeline_purpose !== "production") {
        throw new Error(
            "Only production Journeys can receive production image assets."
        );
    }

    if (journey.is_active) {
        throw new Error(
            "Journey artwork cannot be changed from Content Ops after the Journey is live."
        );
    }

    if (
        assetType === "cover" &&
        journey.cover_image_url?.trim()
    ) {
        throw new Error(
            "This Journey already has a cover image connected."
        );
    }

    if (
        assetType === "hero" &&
        journey.hero_image_url?.trim()
    ) {
        throw new Error(
            "This Journey already has a hero image connected."
        );
    }

    const journeySlug =
        slugifyAudioFilenamePart(journey.title);

    if (!journeySlug) {
        throw new Error(
            "Unable to generate the Journey image filename."
        );
    }

    const extension =
        getJourneyImageExtension(mimeType);

    const { bucket, label } =
        getJourneyImageAssetConfig(assetType);

    const storageObjectName =
        `journey_${journeySlug}_${label}.${extension}`;

    return {
        journey,
        bucket,
        storageObjectName,
    };
}

export async function createJourneyImageUploadTicket(
    input: {
        journeyId: string;
        assetType: JourneyImageAssetType;
        mimeType: string;
        fileSize: number;
    }
) {
    const journeyId =
        String(input?.journeyId ?? "").trim();

    const assetType = input?.assetType;

    const mimeType =
        String(input?.mimeType ?? "").trim();

    const fileSize =
        Number(input?.fileSize);

    if (!journeyId) {
        throw new Error("Missing Journey.");
    }

    if (
        assetType !== "cover" &&
        assetType !== "hero"
    ) {
        throw new Error(
            "Image asset type must be cover or hero."
        );
    }

    getJourneyImageExtension(mimeType);

    if (
        !Number.isInteger(fileSize) ||
        fileSize <= 0 ||
        fileSize > 15 * 1024 * 1024
    ) {
        throw new Error(
            "Journey image must be larger than 0 bytes and no larger than 15 MB."
        );
    }

    const admin =
        await requireContentOpsAdmin();

    const {
        bucket,
        storageObjectName,
    } =
        await getNewProductionImageTarget(
            admin,
            journeyId,
            assetType,
            mimeType
        );

    const { data, error } =
        await admin.storage
            .from(bucket)
            .createSignedUploadUrl(
                storageObjectName,
                {
                    upsert: false,
                }
            );

    if (error) {
        console.error(
            "Journey image signed upload error:",
            error
        );

        throw new Error(
            "Unable to prepare the Journey image upload."
        );
    }

    if (!data?.token) {
        throw new Error(
            "Supabase did not return an image upload token."
        );
    }

    return {
        bucket,
        storageObjectName,
        token: data.token,
    };
}

export async function finalizeJourneyImageUpload(
    input: {
        journeyId: string;
        assetType: JourneyImageAssetType;
        mimeType: string;
        storageObjectName: string;
    }
) {
    const journeyId =
        String(input?.journeyId ?? "").trim();

    const assetType = input?.assetType;

    const mimeType =
        String(input?.mimeType ?? "").trim();

    const storageObjectName =
        String(
            input?.storageObjectName ?? ""
        ).trim();

    if (
        !journeyId ||
        !storageObjectName
    ) {
        throw new Error(
            "Missing Journey or uploaded image."
        );
    }

    if (
        assetType !== "cover" &&
        assetType !== "hero"
    ) {
        throw new Error(
            "Image asset type must be cover or hero."
        );
    }

    getJourneyImageExtension(mimeType);

    const admin =
        await requireContentOpsAdmin();

    const {
        bucket,
        storageObjectName:
        expectedStorageObjectName,
    } =
        await getNewProductionImageTarget(
            admin,
            journeyId,
            assetType,
            mimeType
        );

    if (
        storageObjectName !==
        expectedStorageObjectName
    ) {
        throw new Error(
            "Uploaded image filename does not match the expected Journey image filename."
        );
    }

    const {
        data: storedObjects,
        error: storageError,
    } = await admin.storage
        .from(bucket)
        .list("", {
            limit: 100,
            search: storageObjectName,
        });

    if (storageError) {
        console.error(
            "Journey image verification error:",
            storageError
        );

        throw new Error(
            "Unable to verify the uploaded Journey image."
        );
    }

    const uploadedObject =
        storedObjects?.find(
            (object) =>
                object.name ===
                storageObjectName
        );

    if (!uploadedObject) {
        throw new Error(
            "The uploaded Journey image could not be found in Storage."
        );
    }

    const {
        data: { publicUrl },
    } = admin.storage
        .from(bucket)
        .getPublicUrl(storageObjectName);

    if (!publicUrl) {
        throw new Error(
            "Unable to generate the Journey image URL."
        );
    }

    const { data: result, error: rpcError } =
        await admin.rpc(
            "connect_journey_image_asset",
            {
                p_journey_id: journeyId,
                p_asset_type: assetType,
                p_image_url: publicUrl,
            }
        );

    if (rpcError) {
        console.error(
            "Journey image connection error:",
            rpcError
        );

        throw new Error(rpcError.message);
    }

    revalidatePath(
        `/content-ops/journeys/${journeyId}`
    );

    revalidatePath("/content-ops");

    return {
        success: true,
        assetType,
        publicUrl,
        storageObjectName,
        result,
    };
}
type CreativeOrchestratorPayload = Record<string, unknown>;

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
        `${supabaseUrl}/functions/v1/creative-orchestrator`;

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
            "Creative Orchestrator Content Ops error:",
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

export async function createAndReviewJourneyStepFromContentOps(input: {
    journeyId: string;
    stepId: string;
}) {
    const journeyId =
        String(input?.journeyId ?? "").trim();

    const stepId =
        String(input?.stepId ?? "").trim();

    if (!journeyId || !stepId) {
        throw new Error("Missing Journey or step.");
    }

    const admin = await requireContentOpsAdmin();

    const { data: journey, error: journeyError } =
        await admin
            .from("journeys")
            .select(
                "id,status,is_active,pipeline_purpose"
            )
            .eq("id", journeyId)
            .maybeSingle();

    if (journeyError || !journey) {
        throw new Error(
            "Unable to verify the Journey."
        );
    }

    if (journey.pipeline_purpose !== "production") {
        throw new Error(
            "Only production Journeys can use the creative pipeline."
        );
    }

    if (journey.is_active) {
        throw new Error(
            "The creative pipeline cannot change a live Journey."
        );
    }

    if (
        !["architected", "in_production"].includes(
            journey.status
        )
    ) {
        throw new Error(
            `Journey is not in an eligible creative state. Current status: ${journey.status}.`
        );
    }

    async function loadStep() {
        const { data: step, error } = await admin
            .from("journey_steps")
            .select(
                "id,journey_id,step_number,status,final_script,editor_verdict"
            )
            .eq("id", stepId)
            .eq("journey_id", journeyId)
            .maybeSingle();

        if (error || !step) {
            throw new Error(
                "Unable to verify the Journey step."
            );
        }

        return step;
    }

    let step = await loadStep();

    /*
      Already complete: make the action safe to call
      again without overwriting an approved script.
    */
    if (
        step.status === "editor_approved" &&
        step.final_script?.trim()
    ) {
        return {
            success: true,
            outcome: "approved" as const,
            stepNumber: step.step_number,
            status: step.status,
            editorVerdict: step.editor_verdict,
        };
    }

    /*
      Do not automatically push through unresolved
      revision or safety states.
    */
    if (step.status === "revision_needed") {
        return {
            success: true,
            outcome: "revision_needed" as const,
            stepNumber: step.step_number,
            status: step.status,
            editorVerdict: step.editor_verdict,
        };
    }

    if (step.status === "human_safety_review") {
        return {
            success: true,
            outcome: "human_safety_review" as const,
            stepNumber: step.step_number,
            status: step.status,
            editorVerdict: step.editor_verdict,
        };
    }

    /*
      Stage 1: Script Writer.
    */
    if (step.status === "architected") {
        await callCreativeOrchestratorFromContentOps({
            action: "write_journey_step",
            journey_step_id: stepId,
        });

        step = await loadStep();
    }

    if (step.status === "human_safety_review") {
        revalidatePath(
            `/content-ops/journeys/${journeyId}`
        );
        revalidatePath("/content-ops");

        return {
            success: true,
            outcome: "human_safety_review" as const,
            stepNumber: step.step_number,
            status: step.status,
            editorVerdict: step.editor_verdict,
        };
    }

    /*
      Stage 2: Trusted Voice Editor.
    */
    if (step.status === "drafted") {
        await callCreativeOrchestratorFromContentOps({
            action: "review_journey_step",
            journey_step_id: stepId,
        });

        step = await loadStep();
    }

    revalidatePath(
        `/content-ops/journeys/${journeyId}`
    );
    revalidatePath("/content-ops");

    if (
        step.status === "editor_approved" &&
        step.final_script?.trim()
    ) {
        return {
            success: true,
            outcome: "approved" as const,
            stepNumber: step.step_number,
            status: step.status,
            editorVerdict: step.editor_verdict,
        };
    }

    if (step.status === "revision_needed") {
        return {
            success: true,
            outcome: "revision_needed" as const,
            stepNumber: step.step_number,
            status: step.status,
            editorVerdict: step.editor_verdict,
        };
    }

    if (step.status === "human_safety_review") {
        return {
            success: true,
            outcome: "human_safety_review" as const,
            stepNumber: step.step_number,
            status: step.status,
            editorVerdict: step.editor_verdict,
        };
    }

    throw new Error(
        `Day ${step.step_number} stopped in unexpected status: ${step.status}.`
    );
}


export async function reviseAndReviewJourneyStepFromContentOps(input: {
    journeyId: string;
    stepId: string;
}) {
    const journeyId =
        String(input?.journeyId ?? "").trim();

    const stepId =
        String(input?.stepId ?? "").trim();

    if (!journeyId || !stepId) {
        throw new Error(
            "Missing Journey or step."
        );
    }

    const admin =
        await requireContentOpsAdmin();

    const {
        data: journey,
        error: journeyError,
    } = await admin
        .from("journeys")
        .select(
            "id,status,is_active,pipeline_purpose"
        )
        .eq("id", journeyId)
        .maybeSingle();

    if (journeyError || !journey) {
        throw new Error(
            "Unable to verify the Journey."
        );
    }

    if (
        journey.pipeline_purpose !==
        "production"
    ) {
        throw new Error(
            "Only production Journeys can run an automated step revision."
        );
    }

    if (journey.is_active) {
        throw new Error(
            "A live Journey cannot run an automated step revision."
        );
    }

    if (
        journey.status !==
        "in_production"
    ) {
        throw new Error(
            `Journey must remain in production during step revision. Current status: ${journey.status}.`
        );
    }

    const loadStep = async () => {
        const {
            data: step,
            error: stepError,
        } = await admin
            .from("journey_steps")
            .select(
                `
          id,
          journey_id,
          step_number,
          status,
          script_draft,
          final_script,
          editor_verdict,
          editor_notes,
          revision_count
        `
            )
            .eq("id", stepId)
            .eq("journey_id", journeyId)
            .maybeSingle();

        if (stepError || !step) {
            throw new Error(
                "Unable to verify the Journey step."
            );
        }

        return step;
    };

    let step = await loadStep();

    if (
        step.status !==
        "revision_needed"
    ) {
        throw new Error(
            `Day ${step.step_number} is not waiting for revision. Current status: ${step.status}.`
        );
    }

    if (
        step.editor_verdict !==
        "REVISION NEEDED"
    ) {
        throw new Error(
            `Day ${step.step_number} does not have a REVISION NEEDED verdict.`
        );
    }

    if (!step.script_draft?.trim()) {
        throw new Error(
            `Day ${step.step_number} is missing its rejected draft.`
        );
    }

    if (!step.editor_notes?.trim()) {
        throw new Error(
            `Day ${step.step_number} is missing Voice Editor revision notes.`
        );
    }

    if (step.final_script) {
        throw new Error(
            `Day ${step.step_number} already has a final script and cannot be automatically revised.`
        );
    }

    /*
      Stage 1:
      Ask the assigned Writer to revise this rejected
      Day from the Voice Editor's feedback.
    */
    await callCreativeOrchestratorFromContentOps({
        action: "revise_journey_step",
        journey_step_id: stepId,
    });

    step = await loadStep();

    /*
      The Reviser may itself raise a safety concern.
    */
    if (
        step.status ===
        "human_safety_review"
    ) {
        revalidatePath(
            `/content-ops/journeys/${journeyId}`
        );
        revalidatePath("/content-ops");

        return {
            success: true,
            outcome:
                "human_safety_review" as const,
            stepNumber: step.step_number,
            status: step.status,
            revisionCount:
                step.revision_count,
        };
    }

    /*
      A successful Writer revision should return the
      Day to drafted so the Voice Editor can review it.
    */
    if (step.status !== "drafted") {
        throw new Error(
            `Day ${step.step_number} revision stopped in unexpected status: ${step.status}.`
        );
    }

    /*
      Stage 2:
      Send only this newly revised Day back to its
      assigned Trusted Voice Editor.
    */
    await callCreativeOrchestratorFromContentOps({
        action: "review_journey_step",
        journey_step_id: stepId,
    });

    step = await loadStep();

    revalidatePath(
        `/content-ops/journeys/${journeyId}`
    );
    revalidatePath("/content-ops");

    if (
        step.status ===
            "editor_approved" &&
        step.final_script?.trim()
    ) {
        return {
            success: true,
            outcome: "approved" as const,
            stepNumber: step.step_number,
            status: step.status,
            editorVerdict:
                step.editor_verdict,
            revisionCount:
                step.revision_count,
        };
    }

    if (
        step.status ===
        "revision_needed"
    ) {
        return {
            success: true,
            outcome:
                "revision_needed" as const,
            stepNumber: step.step_number,
            status: step.status,
            editorVerdict:
                step.editor_verdict,
            revisionCount:
                step.revision_count,
        };
    }

    if (
        step.status ===
        "human_safety_review"
    ) {
        return {
            success: true,
            outcome:
                "human_safety_review" as const,
            stepNumber: step.step_number,
            status: step.status,
            editorVerdict:
                step.editor_verdict,
            revisionCount:
                step.revision_count,
        };
    }

    throw new Error(
        `Day ${step.step_number} stopped in unexpected status after revision review: ${step.status}.`
    );
}

export async function importApprovedJourneyStepFromContentOps(input: {
    journeyId: string;
    stepId: string;
    approvedScript: string;
}) {
    const journeyId =
        String(input?.journeyId ?? "").trim();

    const stepId =
        String(input?.stepId ?? "").trim();

    const approvedScript =
        String(input?.approvedScript ?? "")
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .trim();

    if (!journeyId || !stepId) {
        throw new Error("Missing Journey or step.");
    }

    if (!approvedScript) {
        throw new Error(
            "Approved script cannot be empty."
        );
    }

    const admin =
        await requireContentOpsAdmin();

    const {
        data: journey,
        error: journeyError,
    } = await admin
        .from("journeys")
        .select(
            "id,status,is_active,pipeline_purpose"
        )
        .eq("id", journeyId)
        .maybeSingle();

    if (journeyError || !journey) {
        throw new Error(
            "Unable to verify the Journey."
        );
    }

    if (
        journey.pipeline_purpose !==
        "production"
    ) {
        throw new Error(
            "Only production Journeys can import approved scripts."
        );
    }

    if (journey.is_active) {
        throw new Error(
            "Approved scripts cannot be imported into a live Journey."
        );
    }

    if (
        !["architected", "in_production"].includes(
            journey.status
        )
    ) {
        throw new Error(
            `Journey is not in an eligible creative state. Current status: ${journey.status}.`
        );
    }

    const {
        data: step,
        error: stepError,
    } = await admin
        .from("journey_steps")
        .select(
            "id,journey_id,step_number,status,script_draft,revised_script,final_script,content_id"
        )
        .eq("id", stepId)
        .eq("journey_id", journeyId)
        .maybeSingle();

    if (stepError || !step) {
        throw new Error(
            "Unable to verify the Journey step."
        );
    }

    if (step.status !== "architected") {
        throw new Error(
            `Existing approved scripts can only be imported into an architected step. Current status: ${step.status}.`
        );
    }

    if (
        step.script_draft?.trim() ||
        step.revised_script?.trim() ||
        step.final_script?.trim()
    ) {
        throw new Error(
            "This Journey step already contains script work. Automatic overwrite is disabled."
        );
    }

    if (step.content_id) {
        throw new Error(
            "This Journey step already has production content connected."
        );
    }

    const now =
        new Date().toISOString();

    const {
        data: updatedStep,
        error: updateError,
    } = await admin
        .from("journey_steps")
        .update({
            script_draft: approvedScript,
            final_script: approvedScript,
            editor_verdict: "APPROVED",
            editor_notes:
                "Existing human-approved script imported through Content Ops. Automated Script Writer and Trusted Voice Editor were intentionally skipped for this step.",
            status: "editor_approved",
            updated_at: now,
        })
        .eq("id", stepId)
        .eq("journey_id", journeyId)
        .eq("status", "architected")
        .is("script_draft", null)
        .is("final_script", null)
        .select(
            "id,step_number,status,final_script,editor_verdict"
        )
        .single();

    if (updateError || !updatedStep) {
        throw new Error(
            `Unable to import approved Journey script: ${
                updateError?.message ??
                "Journey step changed unexpectedly"
            }`
        );
    }

    const {
        error: journeyUpdateError,
    } = await admin
        .from("journeys")
        .update({
            status: "in_production",
            updated_at: now,
        })
        .eq("id", journeyId)
        .in(
            "status",
            ["architected", "in_production"]
        );

    if (journeyUpdateError) {
        throw new Error(
            `Approved script was saved, but the Journey could not be moved into production: ${journeyUpdateError.message}`
        );
    }

    revalidatePath(
        `/content-ops/journeys/${journeyId}`
    );
    revalidatePath("/content-ops");

    return {
        success: true,
        outcome: "approved" as const,
        stepNumber: updatedStep.step_number,
        status: updatedStep.status,
    };
}

export async function editApprovedJourneyScript(
    formData: FormData
) {
    const journeyId =
        String(
            formData.get("journey_id") ?? ""
        ).trim();

    const stepId =
        String(
            formData.get("step_id") ?? ""
        ).trim();

    const approvedScript =
        String(
            formData.get("approved_script") ?? ""
        )
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .trim();

    if (!journeyId || !stepId) {
        throw new Error(
            "Missing Journey or step."
        );
    }

    if (!approvedScript) {
        throw new Error(
            "Approved script cannot be empty."
        );
    }

    const admin =
        await requireContentOpsAdmin();

    const {
        data: journey,
        error: journeyError,
    } = await admin
        .from("journeys")
        .select(
            "id,status,is_active,pipeline_purpose"
        )
        .eq("id", journeyId)
        .maybeSingle();

    if (journeyError || !journey) {
        throw new Error(
            "Unable to verify the Journey."
        );
    }

    if (
        journey.pipeline_purpose !==
        "production"
    ) {
        throw new Error(
            "Only production Journeys can edit approved scripts."
        );
    }

    if (journey.is_active) {
        throw new Error(
            "Approved scripts cannot be edited after a Journey is live."
        );
    }

    if (
        ![
            "architected",
            "in_production",
            "coherence_approved",
        ].includes(journey.status)
    ) {
        throw new Error(
            `Journey is not in an eligible production state. Current status: ${journey.status}.`
        );
    }

    const {
        data: step,
        error: stepError,
    } = await admin
        .from("journey_steps")
        .select(
            "id,journey_id,step_number,status,final_script,recording_script,content_id,editor_notes"
        )
        .eq("id", stepId)
        .eq("journey_id", journeyId)
        .maybeSingle();

    if (stepError || !step) {
        throw new Error(
            "Unable to verify the Journey step."
        );
    }

    if (step.status !== "editor_approved") {
        throw new Error(
            `Only an editor-approved step can be edited here. Current status: ${step.status}.`
        );
    }

    if (!step.final_script?.trim()) {
        throw new Error(
            "This Journey step does not contain an approved script."
        );
    }

    if (step.recording_script?.trim()) {
        throw new Error(
            "The Approved Script is locked because a Recording Script has already been saved."
        );
    }

    if (step.content_id) {
        throw new Error(
            "The Approved Script is locked because production content is already connected."
        );
    }

    const provenanceNote =
        "Human-approved script edited in Content Ops before recording.";

    const existingNotes =
        step.editor_notes?.trim() ?? "";

    const editorNotes =
        existingNotes.includes(provenanceNote)
            ? existingNotes
            : [existingNotes, provenanceNote]
                  .filter(Boolean)
                  .join("\n\n");

    const {
        data: updatedStep,
        error: updateError,
    } = await admin
        .from("journey_steps")
        .update({
            final_script: approvedScript,
            editor_notes: editorNotes,
            updated_at:
                new Date().toISOString(),
        })
        .eq("id", stepId)
        .eq("journey_id", journeyId)
        .eq("status", "editor_approved")
        .is("recording_script", null)
        .is("content_id", null)
        .select(
            "id,step_number,status,final_script"
        )
        .single();

    if (updateError || !updatedStep) {
        throw new Error(
            `Unable to save the Approved Script: ${
                updateError?.message ??
                "Journey step changed unexpectedly"
            }`
        );
    }

    revalidatePath(
        `/content-ops/journeys/${journeyId}`
    );
    revalidatePath("/content-ops");

    redirect(
        `/content-ops/journeys/${journeyId}?approvedEdited=${encodeURIComponent(
            stepId
        )}`
    );
}

export async function reviewJourneyCoherenceFromContentOps(input: {
    journeyId: string;
}) {
    const journeyId =
        String(input?.journeyId ?? "").trim();

    if (!journeyId) {
        throw new Error("Missing Journey.");
    }

    const admin =
        await requireContentOpsAdmin();

    const {
        data: journey,
        error: journeyError,
    } = await admin
        .from("journeys")
        .select(
            "id,status,is_active,pipeline_purpose,num_days"
        )
        .eq("id", journeyId)
        .maybeSingle();

    if (journeyError || !journey) {
        throw new Error(
            "Unable to verify the Journey."
        );
    }

    if (
        journey.pipeline_purpose !==
        "production"
    ) {
        throw new Error(
            "Only production Journeys can run coherence review."
        );
    }

    if (journey.is_active) {
        throw new Error(
            "A live Journey cannot run creative coherence review."
        );
    }

    /*
      Make the action safe to call again after
      coherence has already been approved.
    */
    if (
        journey.status ===
        "coherence_approved"
    ) {
        return {
            success: true,
            outcome:
                "coherence_approved" as const,
            status: journey.status,
            verdict:
                "COHERENCE APPROVED",
        };
    }

    if (
        journey.status !==
        "in_production"
    ) {
        throw new Error(
            `Journey is not ready for coherence review. Current status: ${journey.status}.`
        );
    }

    const {
        data: steps,
        error: stepsError,
    } = await admin
        .from("journey_steps")
        .select(
            "id,step_number,status,final_script,editor_verdict"
        )
        .eq("journey_id", journeyId)
        .order("step_number", {
            ascending: true,
        });

    if (stepsError) {
        throw new Error(
            "Unable to verify Journey steps."
        );
    }

    const expectedDays =
        Number(journey.num_days ?? 0);

    if (
        !steps ||
        steps.length !== expectedDays
    ) {
        throw new Error(
            `Journey coherence requires ${expectedDays} complete Days, but ${steps?.length ?? 0} were found.`
        );
    }

    const approvedEditorVerdicts =
        new Set([
            "APPROVED",
            "APPROVED WITH MINOR EDITS",
        ]);

    for (const step of steps) {
        if (
            step.status !==
            "editor_approved"
        ) {
            throw new Error(
                `Day ${step.step_number} is not editor approved. Current status: ${step.status}.`
            );
        }

        if (
            !approvedEditorVerdicts.has(
                step.editor_verdict ?? ""
            )
        ) {
            throw new Error(
                `Day ${step.step_number} does not have an approved Voice Editor verdict.`
            );
        }

        if (!step.final_script?.trim()) {
            throw new Error(
                `Day ${step.step_number} is missing its final script.`
            );
        }
    }

    const orchestratorResult =
        await callCreativeOrchestratorFromContentOps(
            {
                action:
                    "review_journey_coherence",
                journey_id: journeyId,
            }
        );

    const {
        data: updatedJourney,
        error: updatedJourneyError,
    } = await admin
        .from("journeys")
        .select("id,status")
        .eq("id", journeyId)
        .maybeSingle();

    if (
        updatedJourneyError ||
        !updatedJourney
    ) {
        throw new Error(
            "Coherence review finished, but Content Ops could not reload the Journey state."
        );
    }

    const possibleVerdicts = [
        orchestratorResult?.verdict,
        orchestratorResult?.coherence?.verdict,
        orchestratorResult?.review?.verdict,
        orchestratorResult?.result?.verdict,
    ];

    const verdict =
        possibleVerdicts.find(
            (value) =>
                typeof value === "string" &&
                value.trim()
        ) ?? null;

    revalidatePath(
        `/content-ops/journeys/${journeyId}`
    );
    revalidatePath("/content-ops");

    if (
        updatedJourney.status ===
        "coherence_approved"
    ) {
        return {
            success: true,
            outcome:
                "coherence_approved" as const,
            status: updatedJourney.status,
            verdict:
                verdict ??
                "COHERENCE APPROVED",
        };
    }

    if (
        updatedJourney.status ===
        "human_safety_review"
    ) {
        return {
            success: true,
            outcome:
                "human_safety_review" as const,
            status: updatedJourney.status,
            verdict:
                verdict ??
                "HUMAN SAFETY REVIEW",
        };
    }

    if (
        verdict === "REVISION NEEDED"
    ) {
        return {
            success: true,
            outcome:
                "revision_needed" as const,
            status: updatedJourney.status,
            verdict,
        };
    }

    return {
        success: true,
        outcome:
            "review_complete" as const,
        status: updatedJourney.status,
        verdict,
    };
}

export async function approveJourneyForRecordingFromContentOps(
    formData: FormData
) {
    const journeyId =
        String(
            formData.get("journey_id") ?? ""
        ).trim();

    const weeklySlateItemId =
        String(
            formData.get(
                "weekly_slate_item_id"
            ) ?? ""
        ).trim();

    if (!journeyId || !weeklySlateItemId) {
        throw new Error(
            "Missing Journey or Curator slate item."
        );
    }

    const admin =
        await requireContentOpsAdmin();

    /*
      Re-verify the Journey at the moment of
      human approval.
    */
    const {
        data: journey,
        error: journeyError,
    } = await admin
        .from("journeys")
        .select(
            "id,status,is_active,pipeline_purpose,num_days"
        )
        .eq("id", journeyId)
        .maybeSingle();

    if (journeyError || !journey) {
        throw new Error(
            "Unable to verify the Journey."
        );
    }

    if (
        journey.pipeline_purpose !==
        "production"
    ) {
        throw new Error(
            "Only production Journeys can be approved for recording."
        );
    }

    if (journey.is_active) {
        throw new Error(
            "A live Journey cannot enter the recording approval gate."
        );
    }

    if (
        journey.status !==
        "coherence_approved"
    ) {
        throw new Error(
            `Journey is not ready for human recording approval. Current status: ${journey.status}.`
        );
    }

    /*
      Every Day must still be waiting at the
      human approval gate, with its exact
      recording script ready and no audio
      content connected yet.
    */
    const {
        data: steps,
        error: stepsError,
    } = await admin
        .from("journey_steps")
        .select(
            `
        id,
        step_number,
        status,
        final_script,
        recording_script,
        content_id
      `
        )
        .eq("journey_id", journeyId)
        .order("step_number", {
            ascending: true,
        });

    if (stepsError) {
        throw new Error(
            "Unable to verify Journey steps."
        );
    }

    const expectedDays =
        Number(journey.num_days ?? 0);

    if (
        !steps ||
        steps.length !== expectedDays
    ) {
        throw new Error(
            `Journey approval requires ${expectedDays} complete Days, but ${steps?.length ?? 0} were found.`
        );
    }

    for (const step of steps) {
        if (
            step.status !==
            "pending_human_approval"
        ) {
            throw new Error(
                `Day ${step.step_number} is not waiting for human approval. Current status: ${step.status}.`
            );
        }

        if (!step.final_script?.trim()) {
            throw new Error(
                `Day ${step.step_number} is missing its approved final script.`
            );
        }

        if (
            !step.recording_script?.trim()
        ) {
            throw new Error(
                `Day ${step.step_number} is missing its Recording Script.`
            );
        }

        if (step.content_id) {
            throw new Error(
                `Day ${step.step_number} already has connected audio content.`
            );
        }
    }

    /*
      Verify that the submitted slate item is
      the current undecided Curator decision
      for this Journey.
    */
    const {
        data: slateItem,
        error: slateItemError,
    } = await admin
        .from("weekly_slate_items")
        .select(
            `
        id,
        weekly_slate_id,
        journey_id,
        curator_action,
        human_decision
      `
        )
        .eq("id", weeklySlateItemId)
        .eq("journey_id", journeyId)
        .maybeSingle();

    if (
        slateItemError ||
        !slateItem
    ) {
        throw new Error(
            "Unable to verify the Curator recommendation."
        );
    }

    if (slateItem.human_decision) {
        throw new Error(
            "This Journey already has a human decision for this Curator slate."
        );
    }

    const eligibleCuratorActions =
        new Set([
            "APPROVE FOR RECORDING",
            "APPROVE AFTER MICRO-EDITS",
        ]);

    if (
        !eligibleCuratorActions.has(
            slateItem.curator_action ?? ""
        )
    ) {
        throw new Error(
            `Curator action ${slateItem.curator_action ?? "unknown"} is not eligible for recording approval.`
        );
    }

    /*
      A Journey is one production decision.
      Verify the entire package before calling
      the existing approval RPC through the
      Creative Orchestrator.
    */
    const {
        data: packageItems,
        error: packageItemsError,
    } = await admin
        .from("weekly_slate_items")
        .select(
            `
        id,
        journey_step_id,
        curator_action,
        human_decision
      `
        )
        .eq(
            "weekly_slate_id",
            slateItem.weekly_slate_id
        )
        .eq("journey_id", journeyId);

    if (packageItemsError) {
        throw new Error(
            "Unable to verify the complete Curator Journey package."
        );
    }

    if (
        !packageItems ||
        packageItems.length !== expectedDays
    ) {
        throw new Error(
            `Curator package should contain ${expectedDays} Journey Days, but ${packageItems?.length ?? 0} were found.`
        );
    }

    for (const item of packageItems) {
        if (item.human_decision) {
            throw new Error(
                "Part of this Journey package already has a human decision."
            );
        }

        if (
            !eligibleCuratorActions.has(
                item.curator_action ?? ""
            )
        ) {
            throw new Error(
                "The complete Journey package is not eligible for recording approval."
            );
        }
    }

    /*
      IMPORTANT:
      Do not directly update journey_steps here.
      The existing backend approval action owns
      the package-level state transition.
    */
    await callCreativeOrchestratorFromContentOps(
        {
            action: "approve_slate_item",
            weekly_slate_item_id:
                weeklySlateItemId,
            human_notes:
                "Human approval completed in Content Ops after reviewing the Curator recommendation and final Recording Scripts.",
        }
    );

    /*
      Confirm the package actually advanced.
    */
    const {
        data: approvedSteps,
        error: approvedStepsError,
    } = await admin
        .from("journey_steps")
        .select(
            "id,step_number,status"
        )
        .eq("journey_id", journeyId)
        .order("step_number", {
            ascending: true,
        });

    if (approvedStepsError) {
        throw new Error(
            "Journey was approved, but its updated step state could not be verified."
        );
    }

    const allHumanApproved =
        approvedSteps?.length ===
            expectedDays &&
        approvedSteps.every(
            (step) =>
                step.status ===
                "human_approved"
        );

    if (!allHumanApproved) {
        throw new Error(
            "The approval action returned, but not every Journey Day reached human_approved."
        );
    }

    revalidatePath(
        `/content-ops/journeys/${journeyId}`
    );
    revalidatePath("/content-ops");

    redirect(
        `/content-ops/journeys/${journeyId}?approvedForRecording=1`
    );
}
