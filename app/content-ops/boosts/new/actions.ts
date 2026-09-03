"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { createClient } from "../../../../lib/supabase/server";

const BOOST_FORMATS = [
    "affirmation",
    "story",
    "meditation",
] as const;

const TRUSTED_VOICES = [
    "Tiffany",
    "Asher",
    "Emma",
    "Julius",
    "Hope",
    "Amina",
    "Heracles",
    "David",
    "New Sworkit",
] as const;

type BoostFormat = (typeof BOOST_FORMATS)[number];
type TrustedVoice = (typeof TRUSTED_VOICES)[number];

async function requireContentOpsAdmin() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error(
            "You must be signed in to use Content Ops."
        );
    }

    const adminEmail =
        process.env.CONTENT_OPS_ADMIN_EMAIL
            ?.trim()
            .toLowerCase();

    if (!adminEmail) {
        throw new Error(
            "CONTENT_OPS_ADMIN_EMAIL is not configured."
        );
    }

    const userEmail =
        user.email?.trim().toLowerCase();

    if (userEmail !== adminEmail) {
        throw new Error(
            "This account does not have permission to use Content Ops."
        );
    }

    return createAdminClient();
}

async function callCreativeOrchestrator(
    payload: Record<string, unknown>
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
            "Start Boost architecture error:",
            result
        );

        const detail =
            typeof result?.detail === "string"
                ? result.detail
                : typeof result?.error === "string"
                    ? result.error
                    : "Unable to create the Boost architecture.";

        throw new Error(detail);
    }

    return result;
}

export async function createBoostArchitectureFromContentOps(
    input: {
        mindsetFeelingSlug: string;
        boostFormat: string;
        trustedVoice?: string;
        creativeDirection?: string;
    }
) {
    const mindsetFeelingSlug = String(
        input?.mindsetFeelingSlug ?? ""
    ).trim();

    const boostFormat = String(
        input?.boostFormat ?? ""
    ).trim();

    const trustedVoice = String(
        input?.trustedVoice ?? ""
    ).trim();

    const creativeDirection = String(
        input?.creativeDirection ?? ""
    ).trim();

    if (!mindsetFeelingSlug) {
        throw new Error(
            "Choose a mindset feeling before creating the Boost."
        );
    }

    if (
        !BOOST_FORMATS.includes(
            boostFormat as BoostFormat
        )
    ) {
        throw new Error(
            "Choose Affirmation, Story, or Meditation."
        );
    }

    if (
        trustedVoice &&
        !TRUSTED_VOICES.includes(
            trustedVoice as TrustedVoice
        )
    ) {
        throw new Error(
            "Choose a valid Trusted Voice or let the Architect choose."
        );
    }

    if (creativeDirection.length > 3000) {
        throw new Error(
            "Creative direction must be 3,000 characters or fewer."
        );
    }

    const admin = await requireContentOpsAdmin();

    /*
      Verify the human-selected routing destination
      independently before asking the Architect to work.
    */
    const {
        data: feeling,
        error: feelingError,
    } = await admin
        .from("mindset_feelings")
        .select(
            "id, name, slug, category_slug"
        )
        .eq("is_active", true)
        .eq("slug", mindsetFeelingSlug)
        .maybeSingle();

    if (feelingError) {
        throw new Error(
            `Unable to verify the mindset feeling: ${feelingError.message}`
        );
    }

    if (!feeling) {
        throw new Error(
            "The selected mindset feeling is not currently active."
        );
    }

    const result =
        await callCreativeOrchestrator({
            action: "architect_boost",
            concept: {
                mindset_feeling_slug:
                    feeling.slug,

                boost_format:
                    boostFormat,

                trusted_voice:
                    trustedVoice || null,

                creative_direction:
                    creativeDirection || null,

                pipeline_purpose:
                    "production",

                human_direction:
                    `The founder intentionally selected the active mindset feeling "${feeling.name}" (${feeling.slug}) and Boost format "${boostFormat}". Treat both as fixed production constraints.${trustedVoice ? ` The founder also selected Trusted Voice "${trustedVoice}", which is a fixed production constraint.` : " The Trusted Voice was left open for the Architect to choose based on ownership of the central emotional insight."} Infer the strongest specific listener moment, title, target length, emotional job, core insight, and structure. Creative direction is optional context, not permission to change any fixed selection.`,
            },
        });

    const boostId =
        typeof result?.boost_id === "string"
            ? result.boost_id
            : typeof result?.boost?.id === "string"
                ? result.boost.id
                : null;

    if (!boostId) {
        throw new Error(
            "The Boost architecture was created, but Content Ops did not receive its Boost ID."
        );
    }

    revalidatePath("/content-ops");
    revalidatePath("/content-ops/boosts");
    revalidatePath(
        `/content-ops/boosts/${boostId}`
    );

    return {
        success: true,
        boostId,
    };
}
