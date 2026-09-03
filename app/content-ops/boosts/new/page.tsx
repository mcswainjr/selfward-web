import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { createClient } from "../../../../lib/supabase/server";
import NewBoostForm from "./NewBoostForm";

type MindsetFeeling = {
    id: string;
    name: string;
    slug: string;
    category_slug: string;
};

export default async function NewBoostPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/content-ops/login");
    }

    const adminEmail =
        process.env.CONTENT_OPS_ADMIN_EMAIL
            ?.trim()
            .toLowerCase();

    const userEmail =
        user.email
            ?.trim()
            .toLowerCase();

    if (!adminEmail || userEmail !== adminEmail) {
        throw new Error("Not authorized.");
    }

    const admin = createAdminClient();

    const {
        data,
        error,
    } = await admin
        .from("mindset_feelings")
        .select(
            "id, name, slug, category_slug"
        )
        .eq("is_active", true)
        .order("category_slug", {
            ascending: true,
        })
        .order("sort_order", {
            ascending: true,
        });

    if (error) {
        throw new Error(
            `Unable to load mindset feelings: ${error.message}`
        );
    }

    const feelings =
        (data ?? []) as MindsetFeeling[];

    if (feelings.length === 0) {
        throw new Error(
            "No active mindset feelings are available."
        );
    }

    return (
        <main className="min-h-screen bg-[#07101f] px-5 py-10 text-white sm:px-8">
            <div className="mx-auto max-w-4xl">
                <Link
                    href="/content-ops/boosts"
                    className="text-sm font-bold text-white/50 transition hover:text-white"
                >
                    ← Boost Dashboard
                </Link>

                <div className="mb-10 mt-7">
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-200">
                        Selfward Content Ops
                    </p>

                    <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                        Start New Boost
                    </h1>

                    <p className="mt-3 max-w-2xl text-base leading-7 text-white/55">
                        Choose the listener need and content
                        form. The Selfward Content Architect
                        will build the strongest production
                        architecture inside those boundaries.
                    </p>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-white/40">
                        Creating an architecture does not write,
                        record, publish, or release the Boost.
                    </p>
                </div>

                <NewBoostForm
                    feelings={feelings}
                />
            </div>
        </main>
    );
}
