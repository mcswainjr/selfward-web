import Link from "next/link";

export default function ComingSoonPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#020617] to-[#020617] px-6 text-white">
      <div className="max-w-xl text-center">
        <p className="mb-4 text-xs uppercase tracking-widest text-gray-400">
          Coming Soon
        </p>

        <h1 className="mb-4 text-4xl font-semibold tracking-tight">
          Selfward is launching soon.
        </h1>

        <p className="mb-8 text-lg text-gray-300">
          Personalized audio boosts and journeys are almost here.
        </p>

        <Link
          href="/"
          className="inline-block rounded-full bg-[#F97316] px-6 py-3 font-black text-white shadow-lg shadow-orange-950/30 transition hover:-translate-y-0.5 hover:bg-[#fb8a3c]"
        >
          Back to Selfward
        </Link>
      </div>
    </div>
  );
}
