import SharePlayer from "../../components/SharePlayer";

type PageProps = {
  params: Promise<{
    shareId: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { shareId } = await params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        Missing Supabase environment variables.
      </div>
    );
  }

  const headers = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
  };

  const shareRes = await fetch(
    `${supabaseUrl}/rest/v1/share_links?id=eq.${shareId}&select=*`,
    {
      headers,
      cache: "no-store",
    }
  );

  const shareData = await shareRes.json();

  if (!shareRes.ok) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <h1 className="text-xl font-bold mb-4">share_links error</h1>
        <pre className="whitespace-pre-wrap text-sm">
          {JSON.stringify(shareData, null, 2)}
        </pre>
      </div>
    );
  }

  const share = shareData?.[0];

  if (!share) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        No share row found for this link.
      </div>
    );
  }

  const contentRes = await fetch(
  `${supabaseUrl}/rest/v1/content?id=eq.${share.content_id}&select=title,audio_url,content_type,share_preview_start_sec,share_preview_end_sec`,
  {
    headers,
    cache: "no-store",
  }
);

  const contentData = await contentRes.json();

  if (!contentRes.ok) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <h1 className="text-xl font-bold mb-4">content error</h1>
        <pre className="whitespace-pre-wrap text-sm">
          {JSON.stringify(contentData, null, 2)}
        </pre>
      </div>
    );
  }

  const content = contentData?.[0];

  if (!content?.audio_url) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        No audio found for this shared boost.
      </div>
    );
  }

  const senderName = share?.sender_name_snapshot?.trim?.() || null;
  const heading = senderName
    ? `${senderName} thought you needed to hear this.`
    : "Someone thought you needed to hear this.";

  const appDeepLink = `selfward://s/${shareId}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-6">
      <div className="w-full max-w-md text-center space-y-2">
        <p className="text-xs tracking-widest text-gray-400">SHARED BOOST</p>

        <h1 className="text-2xl font-bold">{heading}</h1>

        <p className="text-gray-400">{content.title}</p>

        <p className="text-sm text-gray-500">
          Press play to preview this boost.
        </p>

      <SharePlayer
        audioUrl={content.audio_url}
        appDeepLink={appDeepLink}
        shareId={shareId}
        contentType={content.content_type}
        previewStartSec={content.share_preview_start_sec}
        previewEndSec={content.share_preview_end_sec}
    />

      </div>
    </div>
  );
}