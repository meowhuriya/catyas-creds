import { NextRequest, NextResponse } from "next/server";

// Basic in-memory rate limiter: maximum 60 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count += 1;
  return true;
}

const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("id");

  // Client IP for rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait a minute before requesting more video metadata." },
      { status: 429 }
    );
  }

  // Strict 11-character video ID validation
  if (!videoId || !VIDEO_ID_REGEX.test(videoId)) {
    return NextResponse.json(
      { error: "Invalid video ID. Expected an exact 11-character YouTube video ID." },
      { status: 400 }
    );
  }

  // Construct target URL calling ONLY YouTube's official oEmbed address
  const targetYouTubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const oEmbedEndpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(
    targetYouTubeUrl
  )}&format=json`;

  try {
    const res = await fetch(oEmbedEndpoint, {
      next: { revalidate: 86400 * 30 }, // Cache up to 30 days
      headers: {
        "User-Agent": "CatyasCreds/1.0 (+https://github.com/meowhuriya/catyas-creds)",
      },
    });

    if (!res.ok) {
      // Creator disabled embedding, private, or video unavailable
      return NextResponse.json(
        {
          videoId,
          title: "Lecture Video (Embedding Restricted)",
          author_name: "YouTube Creator",
          thumbnail_url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          canEmbed: false,
          error: "Video cannot be embedded by creator request or is unavailable.",
        },
        { status: 200 }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      videoId,
      title: data.title || "Untitled Lecture",
      author_name: data.author_name || "Unknown Channel",
      thumbnail_url:
        data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      canEmbed: true,
      cachedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        videoId,
        title: "Lecture Video",
        author_name: "YouTube Creator",
        thumbnail_url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        canEmbed: false,
        error: err.message || "Failed to reach YouTube oEmbed service",
      },
      { status: 200 }
    );
  }
}
