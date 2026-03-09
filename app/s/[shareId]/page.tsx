type SharePageProps = {
  params: Promise<{
    shareId: string;
  }>;
};

export default async function SharePage({ params }: SharePageProps) {
  const { shareId } = await params;

  return (
    <main style={{ padding: "48px", fontFamily: "Arial, sans-serif" }}>
      <h1>Open in Selfward</h1>
      <p>Share ID: {shareId}</p>
      <p>If the app is installed, this link should open Selfward.</p>
      <p>If not, this page can become your fallback experience.</p>

      <div style={{ marginTop: "24px" }}>
        <a href={`selfward://s/${shareId}`}>Try opening the app</a>
      </div>
    </main>
  );
}