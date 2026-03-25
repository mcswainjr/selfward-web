export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020617] to-[#020617] text-white flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl text-center">
        {/* Logo / Brand */}
        <h1 className="text-4xl font-semibold tracking-tight mb-4">
          Selfward
        </h1>

        {/* Tagline */}
        <p className="text-xl text-gray-300 mb-6">
          What you need to hear, when you need it most.
        </p>

        {/* Description */}
        <p className="text-gray-400 mb-10 leading-relaxed">
          Selfward gives you personalized audio boosts based on how you're feeling —
          whether you need a reset, a push, or something grounding in the moment.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/s/sample"
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-3 px-6 rounded-full transition"
          >
            Get your first boost
          </a>

          <a
            href="/privacy"
            className="border border-white/20 hover:bg-white/10 py-3 px-6 rounded-full transition"
          >
            Privacy
          </a>

          <a
            href="/terms"
            className="border border-white/20 hover:bg-white/10 py-3 px-6 rounded-full transition"
          >
            Terms
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-sm text-gray-500">
        © {new Date().getFullYear()} Selfward
      </div>
    </div>
  );
}