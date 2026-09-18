import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Drops | Selfward",
  description: "A directory of Selfward Drops.",
  alternates: {
    canonical: "/drops",
  },
};

const drops = [
  {
    title: "The Things They Don’t Put in the Lesson Plan",
    slug: "the-things-they-dont-put-in-the-lesson-plan",
    detail: "A reflection for elementary teachers",
  },
  {
    title: "What This Work Is Worth",
    slug: "what-this-work-is-worth",
    detail: "A reflection for CAC & MDT professionals",
  },
];

export default function DropsPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0b172b 0%, #152c4d 55%, #254875 100%)",
        color: "#f8fafc",
        padding: "48px 24px 72px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 880,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            letterSpacing: "0.3em",
            fontSize: 13,
            fontWeight: 700,
            color: "#c6cfda",
            marginBottom: 72,
          }}
        >
          SELFWARD
        </div>

        <header style={{ marginBottom: 48 }}>
          <div
            style={{
              color: "#ff9f7c",
              letterSpacing: "0.28em",
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            DROP DIRECTORY
          </div>

          <h1
            style={{
              fontSize: "clamp(38px, 6vw, 64px)",
              lineHeight: 1.05,
              margin: 0,
              letterSpacing: "-0.035em",
            }}
          >
            Selfward Drops
          </h1>

          <p
            style={{
              color: "#aebaca",
              fontSize: 18,
              lineHeight: 1.7,
              maxWidth: 620,
              marginTop: 20,
            }}
          >
            A simple place to find every Selfward Drop without remembering the
            full URL.
          </p>
        </header>

        <div
          style={{
            display: "grid",
            gap: 18,
          }}
        >
          {drops.map((drop) => (
            <Link
              key={drop.slug}
              href={`/drops/${drop.slug}`}
              style={{
                display: "block",
                textDecoration: "none",
                color: "inherit",
                background: "rgba(255,255,255,0.055)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 24,
                padding: "28px 30px",
              }}
            >
              <div
                style={{
                  color: "#ff9f7c",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  marginBottom: 12,
                }}
              >
                SELFWARD DROP
              </div>

              <h2
                style={{
                  fontSize: "clamp(23px, 4vw, 31px)",
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                {drop.title}
              </h2>

              <p
                style={{
                  color: "#aebaca",
                  fontSize: 15,
                  margin: "10px 0 20px",
                }}
              >
                {drop.detail}
              </p>

              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#ff7417",
                }}
              >
                Open Drop →
              </div>
            </Link>
          ))}
        </div>

        <footer
          style={{
            marginTop: 72,
            paddingTop: 28,
            borderTop: "1px solid rgba(255,255,255,0.1)",
            color: "#76869a",
            fontSize: 13,
          }}
        >
          © 2026 Selfward
        </footer>
      </div>
    </main>
  );
}
