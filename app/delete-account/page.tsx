export default function DeleteAccountPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B1220] px-6 py-16 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#0B1220_0%,#1F3B68_55%,#0B1220_100%)]" />
      <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 bg-white/5 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-3xl">
        <div className="mb-8 flex justify-center">
          <img
            src="/selfward-logo.svg"
            alt="Selfward"
            className="h-20 opacity-90 sm:h-22"
          />
        </div>

        <h1 className="mb-2 text-center text-4xl font-black">
          Delete Your Selfward Account
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-center text-sm leading-6 text-white/50">
          You can delete your Selfward account and associated data directly in
          the app.
        </p>

        <Section title="Delete your account in the app">
          <ol className="list-decimal space-y-2 pl-5">
            <li>Open the Selfward app</li>
            <li>
              Go to <strong className="text-white">Settings</strong>
            </li>
            <li>
              Tap <strong className="text-white">Delete Account</strong>
            </li>
            <li>Confirm deletion</li>
          </ol>
        </Section>

        <Section title="What happens when you delete your account">
          <ul className="list-disc space-y-2 pl-5">
            <li>Your account is permanently deleted.</li>
            <li>Your preferences and progress are removed.</li>
            <li>Your associated Selfward data is deleted.</li>
            <li>This action cannot be undone.</li>
          </ul>
        </Section>

        <Section title="Need help?">
          If you cannot access your account, email{" "}
          <a
            href="mailto:hello@selfward.app?subject=Delete%20My%20Selfward%20Account"
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