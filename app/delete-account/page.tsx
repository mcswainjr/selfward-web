export default function DeleteAccountPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B1220] px-6 py-16 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#0B1220_0%,#1F3B68_55%,#0B1220_100%)]" />

      <section className="relative z-10 mx-auto max-w-2xl rounded-[34px] border border-white/12 bg-white/[0.08] p-8 shadow-[0_24px_70px_rgba(0,0,0,0.38)] backdrop-blur-md">
        <img
          src="/selfward-logo.svg"
          alt="Selfward"
          className="mx-auto mb-8 h-24 opacity-95"
        />

        <h1 className="mb-5 text-3xl font-black tracking-tight">
          Delete Your Selfward Account
        </h1>

        <p className="mb-7 text-base leading-7 text-white/70">
          You can delete your Selfward account at any time directly in the app.
        </p>

        <h2 className="mb-3 text-xl font-black">Steps to delete your account:</h2>

        <ol className="mb-8 list-decimal space-y-2 pl-6 text-white/72">
          <li>Open the Selfward app.</li>
          <li>
            Go to <strong className="text-white">Settings</strong>.
          </li>
          <li>
            Tap <strong className="text-white">Delete Account</strong>.
          </li>
          <li>Confirm deletion.</li>
        </ol>

        <h2 className="mb-3 text-xl font-black">
          What happens when you delete your account?
        </h2>

        <ul className="mb-8 list-disc space-y-2 pl-6 text-white/72">
          <li>Your account is permanently deleted.</li>
          <li>Your preferences and progress are removed.</li>
          <li>Your associated Selfward data, including reflections, is deleted.</li>
          <li>
            Any data we are legally required to retain may be kept only as
            required by law.
          </li>
          <li>This action cannot be undone.</li>
        </ul>

        <h2 className="mb-3 text-xl font-black">Need help?</h2>

        <p className="text-base leading-7 text-white/70">
          If you cannot access your account, contact us at:
          <br />
          <strong className="text-orange-200">support@selfward.app</strong>
        </p>
      </section>
    </main>
  );
}
