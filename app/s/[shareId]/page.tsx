import SharePlayer from "../../components/SharePlayer";

type PageProps = {
  params: {
    shareId: string;
  };
};

export default async function Page({ params }: PageProps) {
  const { shareId } = params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        Missing Supabase environment variables.
      </div>
    );
  }

  // 1. Fetch share link
  const shareRes = await fetch(
    `${supabaseUrl}/rest/v1/share_links?id=eq.${shareId}&select=*`,
    {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
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

  // 2. Fetch content
  const contentRes = await fetch(
    `${supabaseUrl}/rest/v1/content?id=eq.${share.content_id}&select=title,audio_url`,
    {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6">
      <div className="w-full max-w-xl text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold mb-4">
          Shared Boost
        </p>

        <h1 className="text-3xl font-bold text-center">{heading}</h1>

        {!!content.title && (
          <p className="mt-3 text-gray-400 text-base">{content.title}</p>
        )}

        <p className="mt-4 text-gray-400 text-sm">
          Press play to preview this boost.
        </p>

        <SharePlayer audioUrl={content.audio_url} />
      </div>
    </div>
  );
}