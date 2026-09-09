import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "../../../lib/supabase/server";
import NewJourneyForm from "./NewJourneyForm";

export default async function NewJourneyPage() {
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

    return (
        <main className="min-h-screen bg-[#07101f] px-5 py-10 text-white sm:px-8">
            <div className="mx-auto max-w-4xl">
                <Link
                    href="/content-ops"
                    className="text-sm font-bold text-white/50 transition hover:text-white"
                >
                    ← Content Ops
                </Link>

                <div className="mb-10 mt-7">
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-200">
                        Selfward Content Ops
                    </p>

                    <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                        Start New Journey
                    </h1>

                    <p className="mt-3 max-w-2xl text-base leading-7 text-white/55">
                        Move an approved Journey architecture from the
                        Selfward Content Architect into the real production
                        pipeline.
                    </p>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-white/40">
                        This creates the Journey for production only. Nothing
                        here makes content live in the Selfward app.
                    </p>
                </div>

                <NewJourneyForm />
            </div>
        </main>
    );
}
