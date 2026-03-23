export default function DeleteAccountPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0B1020",
        color: "#F8FAFC",
        padding: "48px 20px 64px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <h1
          style={{
            fontSize: "2.25rem",
            fontWeight: 800,
            marginBottom: 12,
          }}
        >
          Delete Your Selfward Account
        </h1>

        <p
          style={{
            color: "#CBD5E1",
            fontSize: "1rem",
            lineHeight: 1.7,
            marginBottom: 24,
          }}
        >
          You can delete your Selfward account and associated data directly in the
          app.
        </p>

        <section
          style={{
            background: "#111827",
            border: "1px solid #1F2937",
            borderRadius: 16,
            padding: 24,
          }}
        >
          <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginTop: 0 }}>
            Delete your account in the app
          </h2>

          <ol style={{ color: "#CBD5E1", lineHeight: 1.8, paddingLeft: 20 }}>
            <li>Open the Selfward app</li>
            <li>Go to <strong>Settings</strong></li>
            <li>Tap <strong>Delete Account</strong></li>
            <li>Confirm deletion</li>
          </ol>

          <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginTop: 32 }}>
            What happens when you delete your account
          </h2>

          <ul style={{ color: "#CBD5E1", lineHeight: 1.8, paddingLeft: 20 }}>
            <li>Your account is permanently deleted.</li>
            <li>Your preferences and progress are removed.</li>
            <li>Your associated Selfward data is deleted.</li>
            <li>This action cannot be undone.</li>
          </ul>

          <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginTop: 32 }}>
            Need help?
          </h2>

          <p style={{ color: "#CBD5E1", lineHeight: 1.7, marginBottom: 0 }}>
            If you cannot access your account, email{" "}
            <a
              href="mailto:hello@selfward.app?subject=Delete%20My%20Selfward%20Account"
              style={{ color: "#93C5FD" }}
            >
              hello@selfward.app
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}