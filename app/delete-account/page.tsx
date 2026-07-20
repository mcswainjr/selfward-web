import type { ReactNode } from "react";

export default function DeleteAccountPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B1220] px-6 py-16 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#0B1220_0%,#1F3B68_55%,#0B1220_100%)]" />

      <div className="absolute top-0 left-1/2 h-[500px] w-[500px] -translate-x-1/2 bg-white/5 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-3xl">
        <div className="mb-8 flex justify-center">
          <img
            src="/selfward-logo.svg"
            alt="Selfward"
            className="h-20 opacity-90 sm:h-24"
          />
        </div>

        <h1 className="mb-3 text-center text-4xl font-black">
          Delete Your Selfward Account
        </h1>

        <p className="mb-10 text-center text-sm text-white/50">
          Manage your Selfward account and reflection data
        </p>

        <Section title="Delete your account">
          <p>
            You can permanently delete your Selfward account at any time
            directly in the app.
          </p>

          <ol className="mt-4 list-decimal space-y-2 pl-5">
            <li>Open the Selfward app.</li>
            <li>
              Go to <strong className="text-white/90">Settings</strong>.
            </li>
            <li>
              Tap <strong className="text-white/90">Delete Account</strong>.
            </li>
            <li>Confirm deletion.</li>
          </ol>
        </Section>

        <Section title="What happens when you delete your account?">
          <ul className="list-disc space-y-2 pl-5">
            <li>Your account is permanently deleted.</li>
            <li>Your preferences and progress are removed.</li>
            <li>
              Your associated Selfward data, including reflections, is deleted.
            </li>
            <li>
              Any data we are legally required to retain may be kept only as
              required by law.
            </li>
            <li>This action cannot be undone.</li>
          </ul>
        </Section>

        <section
          id="delete-reflections"
          className="mb-5 scroll-mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-md"
        >
          <h2 className="mb-3 text-lg font-bold">
            Delete individual reflections
          </h2>

          <div className="text-[15px] leading-relaxed text-white/70">
            <p>
              You can delete an individual reflection without deleting your
              Selfward account.
            </p>

            <ol className="mt-4 list-decimal space-y-2 pl-5">
              <li>Open the Selfward app.</li>
              <li>
                Go to <strong className="text-white/90">Progress</strong>.
              </li>
              <li>
                Open <strong className="text-white/90">Reflections</strong>.
              </li>
              <li>Select the reflection you want to remove.</li>
              <li>Tap the delete icon and confirm deletion.</li>
            </ol>

            <p className="mt-4">
              Deleting a reflection permanently removes that reflection from
              your Selfward account. Your account and other Selfward data remain
              active.
            </p>
          </div>
        </section>

        <Section title="Need help?">
          <p>
            If you cannot access the app, you may request deletion of your
            Selfward account and associated data by emailing{" "}
            <a
              href="mailto:support@selfward.app?subject=Selfward%20Account%20Deletion%20Request"
              className="font-semibold text-orange-400 hover:underline"
            >
              support@selfward.app
            </a>
            .
          </p>
        </Section>

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
    <section className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-md">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>

      <div className="text-[15px] leading-relaxed text-white/70">
        {children}
      </div>
    </section>
  );
}
