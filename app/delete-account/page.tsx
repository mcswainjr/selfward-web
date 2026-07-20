export default function DeleteAccountPage() {
  return (
    <main
      style={{
        padding: 24,
        maxWidth: 600,
        margin: "0 auto",
        lineHeight: 1.6,
      }}
    >
      <h1>Delete Your Selfward Account</h1>

      <p>
        You can delete your Selfward account at any time directly in the app.
      </p>

      <h2>Steps to delete your account</h2>
      <ol>
        <li>Open the Selfward app.</li>
        <li>
          Go to <strong>Settings</strong>.
        </li>
        <li>
          Tap <strong>Delete Account</strong>.
        </li>
        <li>Confirm deletion.</li>
      </ol>

      <h2>What happens when you delete your account?</h2>
      <ul>
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

      <section
        id="delete-reflections"
        style={{
          scrollMarginTop: 24,
          marginTop: 40,
        }}
      >
        <h2>Delete individual reflections</h2>

        <p>
          You can delete an individual reflection without deleting your
          Selfward account.
        </p>

        <ol>
          <li>Open the Selfward app.</li>
          <li>
            Go to <strong>Progress</strong>.
          </li>
          <li>
            Open <strong>Reflections</strong>.
          </li>
          <li>Select the reflection you want to remove.</li>
          <li>Tap the delete icon and confirm deletion.</li>
        </ol>

        <p>
          Deleting a reflection removes that reflection from your Selfward
          account. Your account and other Selfward data remain active.
        </p>
      </section>

      <h2>Need help?</h2>

      <p>
        If you cannot access the app, you may request deletion of your
        Selfward account and associated data by emailing{" "}
        <a href="mailto:support@selfward.app?subject=Selfward%20Account%20Deletion%20Request">
          <strong>support@selfward.app</strong>
        </a>
        .
      </p>
    </main>
  );
}
