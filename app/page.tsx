export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050B16] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1F3B68_0%,#0B1220_42%,#050B16_100%)]" />
      <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-orange-500/10 blur-3xl" />

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <div className="mx-auto w-full max-w-3xl text-center">
          <div className="relative mx-auto mb-7 flex justify-center">
            <div className="absolute top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-[#FF6B3D]/15 blur-3xl animate-pulse" />
            <div className="absolute top-1/2 h-20 w-56 -translate-y-1/2 rounded-full bg-white/8 blur-2xl" />

            <img
              src="/selfward-logo.svg"
              alt="Selfward"
              className="relative z-10 h-12 opacity-95 sm:h-14"
            />
          </div>

          <p className="mb-4 text-xs font-black uppercase tracking-[0.28em] text-orange-300/90">
            Personalized audio for the moment you’re in
          </p>

          <h1 className="mb-5 text-5xl font-black tracking-tight sm:text-6xl">
            Selfward
          </h1>

          <p className="mx-auto mb-6 max-w-2xl text-2xl font-semibold leading-snug text-white/88 sm:text-3xl">
            What you need to hear, when you need it most.
          </p>

          <p className="mx-auto mb-10 max-w-2xl text-base font-medium leading-8 text-white/58 sm:text-lg">
            Personalized audio boosts based on how you’re feeling. Get a reset,
            a push, or something grounding when the moment calls for it.
          </p>

          <div className="mx-auto flex w-full max-w-xl flex-col gap-4 sm:flex-row sm:justify-center">
            <a
              href="/coming-soon"
              className="rounded-full bg-[#FF6B3D] px-7 py-4 text-center text-base font-black text-white shadow-xl shadow-orange-950/30 transition hover:-translate-y-0.5 hover:bg-[#ff7a50]"
            >
              Get your first boost
            </a>

            <a
              href="/privacy"
              className="rounded-full border border-white/12 bg-white/5 px-7 py-4 text-center text-base font-bold text-white/90 transition hover:bg-white/10"
            >
              Privacy
            </a>

            <a
              href="/terms"
              className="rounded-full border border-white/12 bg-white/5 px-7 py-4 text-center text-base font-bold text-white/90 transition hover:bg-white/10"
            >
              Terms
            </a>
          </div>
        </div>

        <div className="relative z-10 mt-16 text-sm font-medium text-white/35">
          © {new Date().getFullYear()} Selfward
        </div>
      </section>
    </main>
  );
}