export default function TermsPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B1220] px-6 py-16 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#0B1220_0%,#1F3B68_55%,#0B1220_100%)]" />
      <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 bg-white/5 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-3xl">
        <div className="mb-12 flex justify-center">
          <img
            src="/selfward-logo.svg"
            alt="Selfward"
            className="h-16 opacity-95"
          />
        </div>

        <h1 className="mb-2 text-center text-4xl font-black">
          Terms of Use
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-center text-sm leading-6 text-white/50">
          By using Selfward, you agree to these Terms of Use. We’ve kept them
          straightforward so you know what to expect from us and what we expect
          from people using the app.
        </p>

        <Section title="Using Selfward">
          Selfward is intended for personal, non-commercial use unless we
          clearly state otherwise. You agree to use the app in a respectful,
          lawful way and not misuse or interfere with the service.
        </Section>

        <Section title="Accounts">
          You are responsible for maintaining access to your account and for
          providing accurate information when you sign up. If you believe your
          account has been accessed without your permission, contact us as soon
          as possible.
        </Section>

        <Section title="Content and recommendations">
          Selfward provides affirmations, meditations, stories, and other
          personal growth content designed to support reflection, motivation,
          and emotional wellness. The app is not a substitute for medical,
          mental health, or crisis care.
        </Section>

        <Section title="Your use of the app">
          You agree not to copy, reverse engineer, disrupt, scrape, or misuse
          the app or its content. You also agree not to use Selfward in a way
          that could harm the app, other users, or our services.
        </Section>

        <Section title="Intellectual property">
          The Selfward app, branding, design, audio content, written content,
          and related materials are owned by Selfward or used with permission.
          You may not reproduce, distribute, or reuse them beyond normal
          personal use without written permission.
        </Section>

        <Section title="Account deletion">
          You can delete your account at any time in the app or by visiting{" "}
          <a
            href="https://selfward.app/delete-account"
            className="font-semibold text-orange-400 hover:underline"
          >
            selfward.app/delete-account
          </a>
          . When your account is deleted, your associated data is permanently
          removed as described in our Privacy Policy.
        </Section>

        <Section title="Changes to Selfward">
          We may update, improve, pause, or discontinue parts of the app from
          time to time. We may also update these Terms as the product evolves.
          When we make meaningful changes, we’ll update this page.
        </Section>

        <Section title="Limitation of liability">
          We work hard to make Selfward reliable and helpful, but we cannot
          guarantee uninterrupted service or that the app will meet every
          expectation in every situation. Your use of Selfward is at your own
          discretion.
        </Section>

        <Section title="Contact">
          If you have questions about these Terms, contact us at{" "}
          <a
            href="mailto:hello@selfward.app"
            className="font-semibold text-orange-400 hover:underline"
          >
            hello@selfward.app
          </a>
          .
        </Section>

        <div className="mt-16 text-center text-sm text-white/40">
          © {new Date().getFullYear()} Selfward
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: any) {
  return (
    <section className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-md">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      <div className="text-[15px] leading-relaxed text-white/70">
        {children}
      </div>
    </section>
  );
}