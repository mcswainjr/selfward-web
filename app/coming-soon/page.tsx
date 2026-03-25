export default function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020617] to-[#020617] text-white flex items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <p className="text-xs tracking-widest text-gray-400 mb-4 uppercase">
          Coming Soon
        </p>

        <h1 className="text-4xl font-semibold tracking-tight mb-4">
          Selfward is launching soon.
        </h1>

        <p className="text-lg text-gray-300 mb-8">
          Personalized audio boosts, right when you need them most.
        </p>

        <a
          href="/"
          className="inline-block bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-3 px-6 rounded-full transition"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}