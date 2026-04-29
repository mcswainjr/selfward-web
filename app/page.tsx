export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B1220] text-white">
      {/* App-matching gradient */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#0B1220_0%,#1F3B68_55%,#0B1220_100%)]" />

      {/* Subtle center light (NOT glow) */}
      <div className="absolute top-0 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <div className="mx-auto w-full max-w-3xl text-center">

          {/* Logo */}
          <div className="relative mx-auto mb-10 flex justify-center">
            {/* Controlled halo (cleaner than glow) */}
            <div className="absolute top-1/2 h-28 w-28 -translate-y-1/2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm" />

            <img
              src="/selfward-logo.svg"
              alt="Selfward"
              className="relative z-10 h-32 sm:h-36"
            />
          </div>

          {/* Headline */}
          <p className="mx-auto mb-6 max-w-2xl text-2xl font-semibold leading-snug text-white sm:text-3xl">
            What you need to hear, when you need it most.
          </p>

          {/* Subtext */}
          <p className="mx-auto mb-10 max-w-2xl text-base font-medium leading-8 text-white/60 sm:text-lg">
            Personalized audio boosts based on how you’re feeling. Get a reset,
            a push, or something grounding when the moment calls for it.
          </p>

          {/* CTA */}
          <div className="mx-auto flex w-full max-w-xl flex-col gap-4 sm:flex-row sm:justify-center">
            <a
              href="/coming-soon"
              className="rounded-full bg-[#F97316] px-7 py-4 text-center text-base font-black text-white shadow-lg shadow-orange-900/30 transition hover:-translate-y-0.5 hover:bg-[#fb8a3c]"
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

        {/* Footer */}
        <div className="relative z-10 mt-16 text-sm font-medium text-white/35">
          © {new Date().getFullYear()} Selfward
        </div>
      </section>
    </main>
  );
}