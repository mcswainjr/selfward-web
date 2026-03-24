export default function PrivacyPage() {
  return (
    <main style={container}>
      <div style={card}>
        <h1 style={title}>Privacy Policy</h1>

        <p style={text}>
          Your privacy matters to us. This page explains what information we
          collect, how we use it, and how we protect it.
        </p>

        <section style={section}>
          <h2 style={heading}>Information We Collect</h2>
          <p style={text}>
            When you use Selfward, we may collect basic information such as your
            account details, preferences, and how you interact with the app.
          </p>
        </section>

        <section style={section}>
          <h2 style={heading}>How We Use Your Information</h2>
          <p style={text}>
            We use your information to personalize your experience, improve the
            app, and provide content that is relevant to how you're feeling.
          </p>
        </section>

        <section style={section}>
          <h2 style={heading}>Data Protection</h2>
          <p style={text}>
            We take reasonable steps to protect your data and keep your
            information secure.
          </p>
        </section>

        <section style={section}>
          <h2 style={heading}>Your Choices</h2>
          <p style={text}>
            You can update your preferences or delete your account at any time
            directly within the app.
          </p>
        </section>

        <section style={section}>
          <h2 style={heading}>Contact</h2>
          <p style={text}>
            If you have any questions, reach out to us at{" "}
            <a href="mailto:hello@selfward.app" style={link}>
              hello@selfward.app
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}

/* ---------- Styles ---------- */

const container = {
  minHeight: "100vh",
  background: "#0B1020",
  color: "#F8FAFC",
  padding: "48px 20px",
  fontFamily: "Arial, sans-serif",
};

const card = {
  maxWidth: 720,
  margin: "0 auto",
  background:
    "linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(17,24,39,0.95) 100%)",
  border: "1px solid #1E293B",
  borderRadius: 20,
  padding: "28px",
};

const title = {
  fontSize: "2rem",
  fontWeight: 800,
  marginBottom: 16,
};

const section = {
  marginTop: 24,
};

const heading = {
  fontSize: "1.2rem",
  fontWeight: 700,
  marginBottom: 8,
};

const text = {
  color: "#CBD5E1",
  lineHeight: 1.6,
};

const link = {
  color: "#60A5FA",
  textDecoration: "none",
};