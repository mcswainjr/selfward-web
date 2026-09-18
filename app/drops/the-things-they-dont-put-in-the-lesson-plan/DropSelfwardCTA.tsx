"use client";

import Link from "next/link";
import posthog from "posthog-js";

export default function DropSelfwardCTA() {
  const href = "/coming-soon";

  return (
    <Link
      href={href}
      onClick={() => {
        posthog.capture("drop_selfward_cta_clicked", {
          drop_slug: "the-things-they-dont-put-in-the-lesson-plan",
          destination: href,
        });
      }}
      className="mt-7 inline-flex rounded-full bg-[#F97316] px-7 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#fb8a3c]"
    >
      Find what you need in Selfward
    </Link>
  );
}
