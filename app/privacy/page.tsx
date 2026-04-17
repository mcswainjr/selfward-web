export default function PrivacyPage() {
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
            lineHeight: 1.15,
          }}
        >
          Privacy Policy
        </h1>

        <p
          style={{
            color: "#CBD5E1",
            fontSize: "1rem",
            lineHeight: 1.7,
            marginBottom: 32,
          }}
        >
          Effective Date: March 24, 2026
        </p>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Your privacy matters</h2>
          <p style={bodyStyle}>
            Selfward is built to support your personal growth, not to collect more
            information than we need. We only use information that helps the app
            work, personalize your experience, and improve reliability over time.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>What we collect</h2>
          <p style={bodyStyle}>
            Depending on how you use Selfward, we may collect:
          </p>
          <ul style={listStyle}>
            <li style={listItemStyle}>
              Account information, such as your email address
            </li>
            <li style={listItemStyle}>
              Preferences you choose, like support styles, content types, and
              focus areas
            </li>
            <li style={listItemStyle}>
              Activity inside the app, such as content you play, save, or interact
              with
            </li>
            <li style={listItemStyle}>
              Notification settings and related device tokens, if you enable
              notifications
            </li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>How we use your information</h2>
          <p style={bodyStyle}>We use your information to:</p>
          <ul style={listStyle}>
            <li style={listItemStyle}>
              Personalize affirmations, stories, meditations, and recommendations
            </li>
            <li style={listItemStyle}>
              Save your preferences and progress
            </li>
            <li style={listItemStyle}>Keep the app working properly</li>
            <li style={listItemStyle}>
              Improve app performance and the overall user experience
            </li>
            <li style={listItemStyle}>
              Send notifications you have chosen to receive
            </li>
          </ul>
          <p style={bodyStyle}>We do not sell your personal information.</p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Notifications</h2>
          <p style={bodyStyle}>
            If you turn on notifications, Selfward may send things like daily
            boosts, reminders, or updates. You can turn notifications off at any
            time in the app’s Settings.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>How your data is stored</h2>
          <p style={bodyStyle}>
            We use trusted service providers and infrastructure tools to securely
            store and process app data. We take reasonable steps to protect your
            information, but no system can promise absolute security.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Deleting your account</h2>
          <p style={bodyStyle}>
            You can delete your account at any time. When you do, your account,
            preferences, progress, and associated Selfward data are permanently
            removed.
          </p>
          <p style={bodyStyle}>
            You can manage account deletion in the app or here:{" "}
            <a href="https://delete.selfward.app/delete-account" style={linkStyle}>
              delete.selfward.app/delete-account
            </a>
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Third-party services</h2>
          <p style={bodyStyle}>
            Selfward may rely on trusted third-party tools for things like hosting,
            authentication, analytics, storage, and notifications. Those services
            only receive the information necessary to do their job.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Changes to this policy</h2>
          <p style={bodyStyle}>
            We may update this Privacy Policy from time to time as Selfward grows
            and improves. When we make meaningful changes, we’ll update the
            effective date on this page.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Contact</h2>
          <p style={bodyStyle}>
            If you have questions about this Privacy Policy, contact us at{" "}
            <a href="mailto:hello@selfward.app" style={linkStyle}>
              hello@selfward.app
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}

const sectionStyle = {
  background:
    "linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(17,24,39,0.95) 100%)",
  border: "1px solid #1E293B",
  borderRadius: 20,
  padding: "28px 28px 24px",
  marginBottom: 18,
  boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
};

const headingStyle = {
  fontSize: "1.35rem",
  fontWeight: 800,
  margin: "0 0 12px",
  color: "#F8FAFC",
};

const bodyStyle = {
  color: "#CBD5E1",
  lineHeight: 1.75,
  fontSize: "1rem",
  margin: "0 0 14px",
};

const listStyle = {
  color: "#CBD5E1",
  paddingLeft: 22,
  margin: "0 0 14px",
  lineHeight: 1.75,
};

const listItemStyle = {
  marginBottom: 8,
};

const linkStyle = {
  color: "#93C5FD",
  textDecoration: "none",
  fontWeight: 700,
};