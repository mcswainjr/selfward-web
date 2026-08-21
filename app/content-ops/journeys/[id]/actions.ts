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
        .select("id, journey_id")
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

    const { error: updateError } = await admin
        .from("journey_steps")
        .update({
            recording_script: recordingScript,
        })
        .eq("id", stepId)
        .eq("journey_id", journeyId);

    if (updateError) {
        console.error("Recording script save error:", updateError);
        throw new Error("Unable to save recording script.");
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