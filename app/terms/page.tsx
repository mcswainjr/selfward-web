export default function TermsPage() {
  return (
    <main style={container}>
      <div style={card}>
        <h1 style={title}>Terms of Use</h1>

        <p style={text}>
          By using Selfward, you agree to these Terms of Use. We’ve kept them
          straightforward so you know what to expect from us and what we expect
          from people using the app.
        </p>

        <section style={section}>
          <h2 style={heading}>Using Selfward</h2>
          <p style={text}>
            Selfward is intended for personal, non-commercial use unless we
            clearly state otherwise. You agree to use the app in a respectful,
            lawful way and not misuse or interfere with the service.
          </p>
        </section>

        <section style={section}>
          <h2 style={heading}>Accounts</h2>
          <p style={text}>
            You are responsible for maintaining access to your account and for
            providing accurate information when you sign up. If you believe your
            account has been accessed without your permission, contact us as soon
            as possible.
          </p>
        </section>

        <section style={section}>
          <h2 style={heading}>Content and recommendations</h2>
          <p style={text}>
            Selfward provides affirmations, meditations, stories, and other
            personal growth content designed to support reflection, motivation,
            and emotional wellness. The app is not a substitute for medical,
            mental health, or crisis care.
          </p>
        </section>

        <section style={section}>
          <h2 style={heading}>Your use of the app</h2>
          <p style={text}>
            You agree not to copy, reverse engineer, disrupt, scrape, or misuse
            the app or its content. You also agree not to use Selfward in a way
            that could harm the app, other users, or our services.
          </p>
        </section>

        <section style={section}>
          <h2 style={heading}>Intellectual property</h2>
          <p style={text}>
            The Selfward app, branding, design, audio content, written content,
            and related materials are owned by Selfward or used with permission.
            You may not reproduce, distribute, or reuse them beyond normal
            personal use without written permission.
          </p>
        </section>

        <section style={section}>
          <h2 style={heading}>Account deletion</h2>
          <p style={text}>
            You can delete your account at any time in the app or by visiting{" "}
            <a href="https://seflward.app/delete-account" style={link}>
              delete.selfward.app/delete-account
            </a>
            . When your account is deleted, your associated data is permanently
            removed as described in our Privacy Policy.
          </p>
        </section>

        <section style={section}>
          <h2 style={heading}>Changes to Selfward</h2>
          <p style={text}>
            We may update, improve, pause, or discontinue parts of the app from
            time to time. We may also update these Terms as the product evolves.
            When we make meaningful changes, we’ll update this page.
          </p>
        </section>

        <section style={section}>
          <h2 style={heading}>Limitation of liability</h2>
          <p style={text}>
            We work hard to make Selfward reliable and helpful, but we cannot
            guarantee uninterrupted service or that the app will meet every
            expectation in every situation. Your use of Selfward is at your own
            discretion.
          </p>
        </section>

        <section style={section}>
          <h2 style={heading}>Contact</h2>
          <p style={text}>
            If you have questions about these Terms, contact us at{" "}
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