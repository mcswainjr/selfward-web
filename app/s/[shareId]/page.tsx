import SharePlayer from "@/components/SharePlayer";

export default async function Page({ params }: any) {
  const { shareId } = params;

  // 1. Fetch share link
  const shareRes = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/share_links?id=eq.${shareId}`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
    }
  );

  const shareData = await shareRes.json();
  const share = shareData[0];

  if (!share) return <div>Not found</div>;

  // 2. Fetch content
  const contentRes = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/content?id=eq.${share.content_id}`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
    }
  );

  const contentData = await contentRes.json();
  const content = contentData[0];

  if (!content?.audio_url) return <div>No audio</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6">
      <h1 className="text-2xl font-bold text-center">
        Someone thought you needed to hear this.
      </h1>

      <SharePlayer audioUrl={content.audio_url} />
    </div>
  );
}