"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "../../../lib/supabase/client";

export default function ContentOpsLoginPage() {
    const router = useRouter();
    const [supabase] = useState(() => createClient());

    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [codeSent, setCodeSent] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");

    async function sendCode(event: FormEvent) {
        event.preventDefault();

        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) {
            setMessage("Enter your email address.");
            return;
        }

        setBusy(true);
        setMessage("");

        const { error } = await supabase.auth.signInWithOtp({
            email: normalizedEmail,
            options: {
                shouldCreateUser: false,
            },
        });

        setBusy(false);

        if (error) {
            setMessage(error.message);
            return;
        }

        setEmail(normalizedEmail);
        setCodeSent(true);
        setMessage("Check your email for your sign-in code.");
    }

    async function verifyCode(event: FormEvent) {
        event.preventDefault();

        if (!code.trim()) {
            setMessage("Enter the code from your email.");
            return;
        }

        setBusy(true);
        setMessage("");

        const { error } = await supabase.auth.verifyOtp({
            email,
            token: code.trim(),
            type: "email",
        });

        setBusy(false);

        if (error) {
            setMessage(error.message);
            return;
        }

        router.replace("/content-ops");
        router.refresh();
    }

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#0B1220] text-white">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,#0B1220_0%,#172B4D_55%,#0B1220_100%)]" />

            <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-lg items-center px-6 py-12">
                <div className="w-full rounded-[32px] border border-white/10 bg-white/[0.055] p-7 shadow-2xl shadow-black/20 backdrop-blur sm:p-9">
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-[#FFB59A]">
                        Selfward
                    </p>

                    <h1 className="text-3xl font-black tracking-[-0.04em]">
                        Content Ops
                    </h1>

                    <p className="mt-3 text-sm font-semibold leading-6 text-white/60">
                        Private access for Selfward content production.
                    </p>

                    {!codeSent ? (
                        <form onSubmit={sendCode} className="mt-8 space-y-5">
                            <div>
                                <label
                                    htmlFor="email"
                                    className="mb-2 block text-sm font-bold text-white/75"
                                >
                                    Email
                                </label>

                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    className="w-full rounded-2xl border border-white/12 bg-white/[0.07] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-[#F97316]"
                                    placeholder="you@example.com"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={busy}
                                className="w-full rounded-full bg-[#F97316] px-6 py-3.5 font-black text-white transition hover:bg-[#fb8a3c] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {busy ? "Sending…" : "Send sign-in code"}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={verifyCode} className="mt-8 space-y-5">
                            <div>
                                <label
                                    htmlFor="code"
                                    className="mb-2 block text-sm font-bold text-white/75"
                                >
                                    Sign-in code
                                </label>

                                <input
                                    id="code"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    value={code}
                                    onChange={(event) => setCode(event.target.value)}
                                    className="w-full rounded-2xl border border-white/12 bg-white/[0.07] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-[#F97316]"
                                    placeholder="Enter code"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={busy}
                                className="w-full rounded-full bg-[#F97316] px-6 py-3.5 font-black text-white transition hover:bg-[#fb8a3c] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {busy ? "Signing in…" : "Sign in"}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setCodeSent(false);
                                    setCode("");
                                    setMessage("");
                                }}
                                className="w-full text-sm font-bold text-white/50 transition hover:text-white"
                            >
                                Use a different email
                            </button>
                        </form>
                    )}

                    {message && (
                        <p className="mt-5 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm font-semibold text-white/70">
                            {message}
                        </p>
                    )}
                </div>
            </section>
        </main>
    );
}