type SharePageProps = {
  params: Promise<{
    shareId: string;
  }>;
};

export default async function SharePage({ params }: SharePageProps) {
  const { shareId } = await params;

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#020617",
        color: "#F9FAFB",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "32px 20px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Top Content */}
      <div style={{ maxWidth: 420, margin: "0 auto", width: "100%" }}>
        <p
          style={{
            fontSize: 12,
            color: "#9CA3AF",
            fontWeight: 800,
            letterSpacing: 1,
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          Shared Boost
        </p>

        <h1
          style={{
            fontSize: 28,
            fontWeight: 900,
            lineHeight: "36px",
          }}
        >
          Someone thought you needed to hear this.
        </h1>

        <p
          style={{
            marginTop: 16,
            color: "#9CA3AF",
            fontSize: 15,
            lineHeight: "22px",
          }}
        >
          Selfward gives you personalized audio boosts based on how you’re
          feeling — whether you need a reset, a push, or something grounding in
          the moment.
        </p>

        {/* Bullet Points */}
        <div
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: "1px solid #111827",
          }}
        >
          <p style={bullet}>• Personalized to your mood</p>
          <p style={bullet}>• Quick reset or deeper push</p>
          <p style={bullet}>• Real growth, no noise</p>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{ maxWidth: 420, margin: "0 auto", width: "100%" }}>
        {/* Open App */}
        <a
          href={`selfward://s/${shareId}`}
          style={{
            display: "block",
            textAlign: "center",
            backgroundColor: "#10B981",
            padding: "14px",
            borderRadius: 999,
            fontWeight: 900,
            color: "#052e2b",
            textDecoration: "none",
          }}
        >
          Open in Selfward
        </a>

        {/* Secondary CTA */}
        <a
          href="/"
          style={{
            display: "block",
            textAlign: "center",
            marginTop: 16,
            color: "#9CA3AF",
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Get your first boost
        </a>

        {/* Footer note */}
        <p
          style={{
            marginTop: 16,
            fontSize: 12,
            color: "#6B7280",
            textAlign: "center",
          }}
        >
          Share ID: {shareId}
        </p>
      </div>
    </main>
  );
}

const bullet = {
  color: "#D1D5DB",
  fontSize: 13,
  lineHeight: "20px",
  marginTop: 6,
  fontWeight: 700,
};