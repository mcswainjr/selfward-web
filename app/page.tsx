import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B1220] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#0B1220_0%,#1F3B68_52%,#0B1220_100%)]" />
      <div className="absolute left-1/2 top-[-160px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/6 blur-3xl" />
      <div className="absolute bottom-[-180px] right-[-120px] h-[420px] w-[420px] rounded-full bg-[#FF6B3D]/10 blur-3xl" />

      <style>{`
        @keyframes selfwardFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
        }

        .selfward-logo-float {
          animation: selfwardFloat 6s ease-in-out infinite;
        }
      `}</style>

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between">
          <Link href="/" className="text-sm font-black tracking-[0.24em] text-white/80">
            SELFWARD
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-bold text-white/60 sm:flex">
            <a href="/privacy" className="transition hover:text-white">
              Privacy
            </a>
            <a href="/terms" className="transition hover:text-white">
              Terms
            </a>
            <a href="/delete-account" className="transition hover:text-white">
              Account
            </a>
          </nav>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <div className="relative mx-auto mb-12 flex justify-center">
            <div className="absolute top-1/2 h-48 w-[460px] -translate-y-1/2 rounded-full bg-[#FF6B3D]/8 blur-3xl" />

            <img
              src="/selfward-logo.svg"
              alt="Selfward"
              className="selfward-logo-float relative z-10 h-36 sm:h-44"
            />
          </div>

          <p className="mb-5 text-xs font-black uppercase tracking-[0.28em] text-[#FFB59A]">
            Personalized audio for real moments
          </p>

          <h1 className="mx-auto max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] text-white sm:text-6xl">
            What you need to hear, when you need it most.
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base font-semibold leading-8 text-white/68 sm:text-lg">
            Selfward helps you find a steady reset, a needed push, or a grounded
            next step based on how you are feeling right now.
          </p>

          <div className="mt-10 flex w-full max-w-xl flex-col gap-4 sm:flex-row sm:justify-center">
            <a
              href="/coming-soon"
              className="rounded-full bg-[#F97316] px-7 py-4 text-center text-base font-black text-white shadow-lg shadow-orange-950/30 transition hover:-translate-y-0.5 hover:bg-[#fb8a3c]"
            >
              Get your first boost
            </a>

            <a
              href="/privacy"
              className="rounded-full border border-white/12 bg-white/6 px-7 py-4 text-center text-base font-bold text-white/90 transition hover:bg-white/10"
            >
              Read our privacy promise
            </a>
          </div>
        </div>

        <div className="grid gap-4 pb-10 md:grid-cols-3">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-black/10 backdrop-blur">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-[#FFB59A]">
              Boosts
            </p>
            <h2 className="mb-3 text-xl font-black text-white">A reset in the moment</h2>
            <p className="text-sm font-semibold leading-7 text-white/60">
              Short personalized audio when you need clarity, encouragement,
              grounding, or momentum.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-black/10 backdrop-blur">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-[#FFB59A]">
              Journeys
            </p>
            <h2 className="mb-3 text-xl font-black text-white">Support that builds</h2>
            <p className="text-sm font-semibold leading-7 text-white/60">
              Guided multi-day experiences that help you stay with what matters
              instead of rushing past it.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-black/10 backdrop-blur">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-[#FFB59A]">
              Reflections
            </p>
            <h2 className="mb-3 text-xl font-black text-white">Keep what lands</h2>
            <p className="text-sm font-semibold leading-7 text-white/60">
              Capture the words, shifts, and small decisions you want to carry
              forward.
            </p>
          </div>
        </div>

        <section className="mb-12 rounded-[32px] border border-white/10 bg-[#07142E]/70 p-6 backdrop-blur sm:p-8">
          <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
            <div>
              <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-[#FFB59A]">
                How it works
              </p>
              <h2 className="text-3xl font-black leading-tight tracking-[-0.04em] text-white sm:text-4xl">
                Start with what you are feeling.
              </h2>
            </div>

            <div className="grid gap-4 text-left">
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <p className="text-sm font-bold leading-6 text-white/70">
                  Check in with your mood, moment, or need.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <p className="text-sm font-bold leading-6 text-white/70">
                  Selfward recommends a trusted voice and audio experience.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <p className="text-sm font-bold leading-6 text-white/70">
                  Listen, reflect, and take one grounded next step.
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-7 text-sm font-semibold text-white/42 sm:flex-row">
          <p>© {new Date().getFullYear()} Selfward</p>

          <div className="flex flex-wrap items-center justify-center gap-5">
            <a href="/privacy" className="transition hover:text-white/80">
              Privacy
            </a>
            <a href="/terms" className="transition hover:text-white/80">
              Terms
            </a>
            <a href="/delete-account" className="transition hover:text-white/80">
              Delete account
            </a>
          </div>
        </footer>
      </section>
    </main>
  );
}
