"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "../../lib/supabase/admin";
import { createClient } from "../../lib/supabase/server";

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

export async function releaseJourneyFromContentOps(input: {
    journeyId: string;
}) {
    const journeyId = String(input?.journeyId ?? "").trim();

    if (!journeyId) {
        throw new Error("Missing Journey.");
    }

    const admin = await requireContentOpsAdmin();

    const { data, error } = await admin.rpc(
        "release_journey",
        {
            p_journey_id: journeyId,
        }
    );

    if (error) {
        console.error("Journey release error:", error);
        throw new Error(error.message);
    }

    revalidatePath("/content-ops");
    revalidatePath(`/content-ops/journeys/${journeyId}`);

    return {
        success: true,
        result: data,
    };
}

export async function setJourneyFeaturedFromContentOps(input: {
    journeyId: string;
    isFeatured: boolean;
}) {
    const journeyId = String(input?.journeyId ?? "").trim();
    const isFeatured = Boolean(input?.isFeatured);

    if (!journeyId) {
        throw new Error("Missing Journey.");
    }

    const admin = await requireContentOpsAdmin();

    const { data, error } = await admin.rpc(
        "set_journey_featured",
        {
            p_journey_id: journeyId,
            p_is_featured: isFeatured,
        }
    );

    if (error) {
        console.error("Journey featured update error:", error);
        throw new Error(error.message);
    }

    revalidatePath("/content-ops");
    revalidatePath(`/content-ops/journeys/${journeyId}`);

    return {
        success: true,
        result: data,
    };
}

export async function moveFeaturedJourneyFromContentOps(input: {
    journeyId: string;
    direction: "up" | "down";
}) {
    const journeyId = String(input?.journeyId ?? "").trim();
    const direction = input?.direction;

    if (!journeyId) {
        throw new Error("Missing Journey.");
    }

    if (direction !== "up" && direction !== "down") {
        throw new Error("Invalid Featured move direction.");
    }

    const admin = await requireContentOpsAdmin();

    const { data, error } = await admin.rpc(
        "move_featured_journey",
        {
            p_journey_id: journeyId,
            p_direction: direction,
        }
    );

    if (error) {
        console.error("Featured Journey reorder error:", error);
        throw new Error(error.message);
    }

    revalidatePath("/content-ops");

    return {
        success: true,
        result: data,
    };
}

export async function setJourneyPrioritySlotFromContentOps(input: {
    journeyId: string;
    priority: number;
}) {
    const journeyId = String(input?.journeyId ?? "").trim();
    const priority = Number(input?.priority);

    if (!journeyId) {
        throw new Error("Missing Journey.");
    }

    if (
        !Number.isInteger(priority) ||
        priority < 1 ||
        priority > 5
    ) {
        throw new Error(
            "Journey priority must be between 1 and 5."
        );
    }

    const admin = await requireContentOpsAdmin();

    const { data, error } = await admin.rpc(
        "set_journey_priority_slot",
        {
            p_journey_id: journeyId,
            p_priority: priority,
        }
    );

    if (error) {
        console.error(
            "Journey priority update error:",
            error
        );

        throw new Error(error.message);
    }

    revalidatePath("/content-ops");
    revalidatePath(
        `/content-ops/journeys/${journeyId}`
    );

    return {
        success: true,
        result: data,
    };
}

export async function startProductionJourneyFromContentOps(input: {
    intendedListenerMoment: string;
    architectBrief: string;
}) {
    const intendedListenerMoment = String(
        input?.intendedListenerMoment ?? ""
    ).trim();

    const architectBrief = String(
        input?.architectBrief ?? ""
    ).trim();

    if (!intendedListenerMoment) {
        throw new Error(
            "The intended listener moment is required."
        );
    }

    if (!architectBrief) {
        throw new Error(
            "Paste the approved Content Architect brief before starting production."
        );
    }

    if (architectBrief.length < 200) {
        throw new Error(
            "The Architect brief looks incomplete."
        );
    }

    /*
      This also verifies that the signed-in user is
      the designated Content Ops administrator.
    */
    await requireContentOpsAdmin();

    const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL
            ?.trim();

    const creativeToken =
        process.env.CREATIVE_ORCHESTRATOR_TOKEN
            ?.trim();

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
        body: JSON.stringify({
            action: "architect_journey",
            concept: {
                intended_listener_moment:
                    intendedListenerMoment,

                approved_architecture_brief:
                    architectBrief,

                pipeline_purpose: "production",

                human_direction:
                    "This Journey architecture was created in the founder-facing Selfward Content Architect and has been intentionally submitted by the founder to enter the production pipeline. Treat the pasted architecture as approved creative direction. Preserve its approved working title, Trusted Voice, 2-or-3-day length decision, Journey arc, and step architecture unless a current production rule or genuine safety requirement prevents it. Do not expand the Journey beyond the current launch policy of 2 or 3 days.",
            },
        }),
        cache: "no-store",
    });

    let payload: any = null;

    try {
        payload = await response.json();
    } catch {
        throw new Error(
            "Creative Orchestrator returned an unreadable response."
        );
    }

    if (!response.ok || payload?.success !== true) {
        console.error(
            "Start production Journey error:",
            payload
        );

        const detail =
            typeof payload?.detail === "string"
                ? payload.detail
                : typeof payload?.error === "string"
                    ? payload.error
                    : "Unable to start the Journey production pipeline.";

        throw new Error(detail);
    }

    const journeyId =
        typeof payload?.journey_id === "string"
            ? payload.journey_id
            : typeof payload?.journey?.id === "string"
                ? payload.journey.id
                : null;

    revalidatePath("/content-ops");

    if (journeyId) {
        revalidatePath(
            `/content-ops/journeys/${journeyId}`
        );
    }

    return {
        success: true,
        journeyId,
    };
}