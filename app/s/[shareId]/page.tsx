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
    return <ErrorState message="Missing Supabase environment variables." />;
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
      <ErrorState
        title="Share link error"
        message={JSON.stringify(shareData, null, 2)}
      />
    );
  }

  const share = shareData?.[0];

  if (!share) {
    return <ErrorState message="This shared boost could not be found." />;
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
      <ErrorState
        title="Content error"
        message={JSON.stringify(contentData, null, 2)}
      />
    );
  }

  const content = contentData?.[0];

  if (!content?.audio_url) {
    return <ErrorState message="No audio was found for this shared boost." />;
  }

  const senderName = share?.sender_name_snapshot?.trim?.() || null;

  const heading = senderName
    ? `${senderName} thought you needed to hear this.`
    : "Someone thought you needed to hear this.";

  const appDeepLink = `selfward://s/${shareId}`;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B1220] px-6 py-10 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#0B1220_0%,#1F3B68_55%,#0B1220_100%)]" />
      <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute bottom-[-180px] left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#F97316]/10 blur-3xl" />

      <section className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col justify-center">
        <div className="mb-9 flex justify-center">
          <img
            src="/selfward-logo.svg"
            alt="Selfward"
            className="h-28 opacity-95 sm:h-32"
          />
        </div>

        <div className="rounded-[34px] border border-white/12 bg-white/[0.08] p-7 text-center shadow-[0_24px_70px_rgba(0,0,0,0.38)] backdrop-blur-md">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.26em] text-orange-300/95">
            Shared boost
          </p>

          <h1 className="mb-5 text-3xl font-black leading-tight tracking-tight text-white">
            {heading}
          </h1>

          <p className="mx-auto mb-4 max-w-sm text-base font-bold leading-6 text-white/82">
            “{content.title}”
          </p>

          <p className="mx-auto mb-7 max-w-sm text-sm font-medium leading-6 text-white/56">
            Listen for a moment. If it resonates, there’s more waiting for you
            in Selfward.
          </p>

          <div className="share-player-theme">
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

        <p className="mx-auto mt-8 max-w-sm text-center text-sm leading-6 text-white/45">
          Selfward gives you personalized mindset boosts based on how you’re
          feeling, right when you need them.
        </p>
      </section>

      <style>{`
        .share-player-theme button,
        .share-player-theme a {
          transition: all 180ms ease;
        }

        .share-player-theme button {
          background: #F97316 !important;
          color: white !important;
          border-color: rgba(255, 255, 255, 0.14) !important;
          box-shadow: 0 14px 34px rgba(249, 115, 22, 0.28) !important;
        }

        .share-player-theme button:hover {
          background: #fb8a3c !important;
          transform: translateY(-1px);
        }

        .share-player-theme a {
          color: #FDBA74 !important;
          font-weight: 700;
        }

        .share-player-theme [style*="background"] {
          background-color: #F97316 !important;
        }
      `}</style>
    </main>
  );
}

function ErrorState({
  title = "Something went wrong",
  message,
}: {
  title?: string;
  message: string;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B1220] px-6 py-10 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#0B1220_0%,#1F3B68_55%,#0B1220_100%)]" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.08] p-6 text-center shadow-2xl shadow-black/30 backdrop-blur-md">
        <img
          src="/selfward-logo.svg"
          alt="Selfward"
          className="mx-auto mb-8 h-24 opacity-95"
        />

        <h1 className="mb-3 text-2xl font-black">{title}</h1>

        <p className="whitespace-pre-wrap text-sm leading-6 text-white/60">
          {message}
        </p>

        <a
          href="/"
          className="mt-7 inline-flex rounded-full bg-[#F97316] px-6 py-3 text-sm font-black text-white transition hover:bg-[#fb8a3c]"
        >
          Go to Selfward
        </a>
      </div>
    </main>
  );
}