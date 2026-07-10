import type { ReactNode } from "react";
export default function PrivacyPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B1220] text-white px-6 py-16">

      {/* Background gradient (matches homepage + app) */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#0B1220_0%,#1F3B68_55%,#0B1220_100%)]" />

      {/* Soft ambient light */}
      <div className="absolute top-0 left-1/2 h-[500px] w-[500px] -translate-x-1/2 bg-white/5 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-3xl">

        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <img
            src="/selfward-logo.svg"
            alt="Selfward"
            className="h-20 sm:h-22 opacity-90"
          />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-black mb-2 text-center">
          Privacy Policy
        </h1>

        <p className="text-white/50 text-sm text-center mb-10">
          Effective Date: March 24, 2026
        </p>

        {/* Sections */}
        <Section title="Your privacy matters">
          Selfward is built to support your personal growth, not to collect more
          information than we need. We only use information that helps the app
          work, personalize your experience, and improve reliability over time.
        </Section>

        <Section title="What we collect">
          <p>
            Depending on how you use Selfward, we may collect:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-3">
            <li>Account information, such as your email address</li>
            <li>Preferences you choose, like support styles and focus areas</li>
            <li>Activity inside the app, such as content you play or save</li>
            <li>Notification settings and related device tokens</li>
          </ul>
        </Section>

        <Section title="How we use your information">
          <ul className="list-disc pl-5 space-y-2">
            <li>Personalize your experience</li>
            <li>Save your progress and preferences</li>
            <li>Keep the app working properly</li>
            <li>Improve performance and reliability</li>
            <li>Send notifications you opt into</li>
          </ul>

          <p className="mt-4 font-semibold text-white/90">
            We do not sell your personal information.
          </p>
        </Section>

        <Section title="Notifications">
          If you enable notifications, Selfward may send daily boosts,
          reminders, or updates. You can turn them off anytime in Settings.
        </Section>

        <Section title="How your data is stored">
          We use trusted infrastructure providers to securely store and process
          data. While we take strong precautions, no system can guarantee
          absolute security.
        </Section>

        <Section title="Deleting your account">
          You can delete your account at any time. When you do, your data is
          permanently removed.

          <p className="mt-3">
            Manage deletion here:{" "}
            <a
              href="https://selfward.app/delete-account"
              className="text-orange-400 font-semibold hover:underline"
            >
              selfward.app/delete-account
            </a>
          </p>
        </Section>

        <Section title="Third-party services">
          Selfward uses trusted providers for hosting, analytics, authentication,
          and notifications. These services only receive the data required to
          function.
        </Section>

        <Section title="Changes to this policy">
          We may update this policy over time. When we do, we will update the
          effective date on this page.
        </Section>

        <Section title="Contact">
          Questions? Contact us at{" "}
          <a
            href="mailto:hello@selfward.app"
            className="text-orange-400 font-semibold hover:underline"
          >
            hello@selfward.app
          </a>
        </Section>

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-white/40">
          © {new Date().getFullYear()} Selfward
        </div>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-lg">
      <h2 className="text-lg font-bold mb-3">{title}</h2>
      <div className="text-white/70 leading-relaxed text-[15px]">
        {children}
      </div>
    </section>
  );
}