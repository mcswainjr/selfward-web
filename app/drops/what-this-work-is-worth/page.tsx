import type { Metadata } from "next";
import Link from "next/link";

import DropPlayer from "./DropPlayer";
import DropSelfwardCTA from "./DropSelfwardCTA";

const AUDIO_URL =
  "https://jjzabogmmbzrikomyctt.supabase.co/storage/v1/object/public/drops/what-this-work-is-worth.mp3";

export const metadata: Metadata = {
  metadataBase: new URL("https://selfward.app"),
  title: "What This Work Is Worth | Selfward",
  description:
    "A Selfward reflection for Children's Advocacy Center and multidisciplinary team professionals.",
  alternates: {
    canonical: "https://selfward.app/drops/what-this-work-is-worth",
  },
  openGraph: {
    title: "What This Work Is Worth",
    description:
      "A reflection for Children's Advocacy Center and MDT professionals, from Selfward.",
    url: "https://selfward.app/drops/what-this-work-is-worth",
    siteName: "Selfward",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "What This Work Is Worth",
    description:
      "A reflection for Children's Advocacy Center and MDT professionals, from Selfward.",
  },
};

export default function WhatThisWorkIsWorthPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B1220] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#0B1220_0%,#142847_42%,#1F3B68_68%,#0B1220_100%)]" />
      <div className="absolute left-1/2 top-[-180px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/[0.055] blur-3xl" />
      <div className="absolute right-[-150px] top-[36%] h-[420px] w-[420px] rounded-full bg-[#F97316]/[0.07] blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-8 sm:px-8 sm:py-10">
        <header className="flex items-center">
          <Link
            href="/"
            className="text-xs font-black tracking-[0.26em] text-white/70 transition hover:text-white"
          >
            SELFWARD
          </Link>
        </header>

        <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-14 sm:py-20">
          <div className="text-center">
            <div className="mx-auto mb-8 flex justify-center">
              <img
                src="/selfward-mark.svg"
                alt=""
                className="h-14 w-14 opacity-90"
              />
            </div>

            <p className="mb-5 text-[11px] font-black uppercase tracking-[0.3em] text-[#FFB59A] sm:text-xs">
              A reflection for CAC &amp; MDT professionals
            </p>

            <h1 className="mx-auto max-w-3xl text-4xl font-black leading-[1.02] tracking-[-0.05em] text-white sm:text-6xl">
              What This Work Is Worth
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base font-semibold leading-7 text-white/62 sm:text-lg sm:leading-8">
              For the people who spend their days helping children through
              things no child should have to face.
            </p>

          </div>

          <div className="mx-auto mt-11 w-full max-w-xl rounded-[32px] border border-white/10 bg-[#07142E]/75 p-5 shadow-2xl shadow-black/25 backdrop-blur-md sm:p-7">
            <p className="mb-2 text-center text-[10px] font-black uppercase tracking-[0.22em] text-white/38">
              Heracles · 7 min reflection
            </p>

            <p className="mb-5 text-center text-sm font-semibold leading-6 text-white/52">
              Find a quiet moment. Press play when you are ready.
            </p>

            <DropPlayer audioUrl={AUDIO_URL} />
          </div>

          <div className="mx-auto mt-10 max-w-xl text-center">
            <p className="text-sm font-semibold leading-7 text-white/48">
              No sign-in. No subscription required. Just a few minutes made
              specifically for people who know this work.
            </p>
          </div>
        </section>

        <section className="mx-auto mb-10 w-full max-w-3xl rounded-[30px] border border-white/10 bg-white/[0.045] p-6 text-center backdrop-blur-sm sm:p-8">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FFB59A]">
            From Selfward
          </p>

          <h2 className="mx-auto mt-4 max-w-xl text-2xl font-black tracking-[-0.035em] text-white sm:text-3xl">
            The right words for the moment you are actually in.
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm font-semibold leading-7 text-white/55">
            Selfward creates personalized audio Boosts and guided Journeys
            designed around what you need in the moment.
          </p>

          <DropSelfwardCTA />
        </section>

        <footer className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-7 text-xs font-semibold text-white/35 sm:flex-row">
          <p>© {new Date().getFullYear()} Selfward</p>

          <div className="flex items-center gap-5">
            <Link href="/privacy" className="transition hover:text-white/70">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-white/70">
              Terms
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
