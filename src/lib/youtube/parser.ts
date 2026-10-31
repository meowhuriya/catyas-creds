/**
 * Pure YouTube Link Parser
 * Extracts 11-character video ID, start time, and flags playlist-only or invalid links.
 */

export interface ParsedYouTubeLink {
  isValid: boolean;
  videoId?: string;
  startTimeSeconds?: number;
  isPlaylistOnly?: boolean;
  error?: string;
  originalUrl: string;
}

const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export function parseYouTubeUrl(inputUrl: string): ParsedYouTubeLink {
  const raw = inputUrl.trim();
  if (!raw) {
    return {
      isValid: false,
      error: "Empty URL provided",
      originalUrl: raw,
    };
  }

  // Check if it's purely a 11-char ID already
  if (VIDEO_ID_REGEX.test(raw)) {
    return {
      isValid: true,
      videoId: raw,
      startTimeSeconds: 0,
      originalUrl: `https://www.youtube.com/watch?v=${raw}`,
    };
  }

  try {
    // Add protocol if missing for URL parser
    const urlString = raw.startsWith("http://") || raw.startsWith("https://")
      ? raw
      : `https://${raw}`;

    const parsed = new URL(urlString);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");

    // Check for YouTube domains
    const isYouTube =
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtu.be" ||
      host === "youtube-nocookie.com";

    if (!isYouTube) {
      return {
        isValid: false,
        error: "Not a valid YouTube domain",
        originalUrl: raw,
      };
    }

    // Check for playlist-only links (e.g. /playlist?list=...)
    if (parsed.pathname === "/playlist" && parsed.searchParams.has("list")) {
      return {
        isValid: false,
        isPlaylistOnly: true,
        error: "Playlist links are not supported. Paste individual video links.",
        originalUrl: raw,
      };
    }

    let videoId: string | null = null;
    let startTimeSeconds = 0;

    // 1. youtu.be/VIDEO_ID
    if (host === "youtu.be") {
      const pathParts = parsed.pathname.split("/").filter(Boolean);
      if (pathParts.length > 0) {
        videoId = pathParts[0];
      }
    }
    // 2. youtube.com/shorts/VIDEO_ID
    else if (parsed.pathname.startsWith("/shorts/")) {
      const parts = parsed.pathname.replace("/shorts/", "").split("/").filter(Boolean);
      if (parts.length > 0) {
        videoId = parts[0];
      }
    }
    // 3. youtube.com/embed/VIDEO_ID
    else if (parsed.pathname.startsWith("/embed/")) {
      const parts = parsed.pathname.replace("/embed/", "").split("/").filter(Boolean);
      if (parts.length > 0) {
        videoId = parts[0];
      }
    }
    // 4. youtube.com/watch?v=VIDEO_ID
    else if (parsed.pathname === "/watch") {
      videoId = parsed.searchParams.get("v");
    }

    // Extract start time: parameter 't' or 'start'
    const tParam = parsed.searchParams.get("t") || parsed.searchParams.get("start");
    if (tParam) {
      startTimeSeconds = parseTimeParam(tParam);
    }

    if (!videoId || !VIDEO_ID_REGEX.test(videoId)) {
      // If it contains list= but no valid v=, warn user
      if (parsed.searchParams.has("list")) {
        return {
          isValid: false,
          isPlaylistOnly: true,
          error: "Playlist links are not supported. Paste individual video links.",
          originalUrl: raw,
        };
      }
      return {
        isValid: false,
        error: "Could not extract a valid 11-character video ID",
        originalUrl: raw,
      };
    }

    return {
      isValid: true,
      videoId,
      startTimeSeconds,
      originalUrl: raw,
    };
  } catch {
    return {
      isValid: false,
      error: "Malformed URL",
      originalUrl: raw,
    };
  }
}

/**
 * Parses time formats: '1h20m15s', '80m', '120s', '45'
 */
function parseTimeParam(timeParam: string): number {
  const clean = timeParam.trim().toLowerCase();

  // If purely numeric
  if (/^\d+$/.test(clean)) {
    return parseInt(clean, 10);
  }

  let total = 0;
  const hoursMatch = clean.match(/(\d+)h/);
  if (hoursMatch) total += parseInt(hoursMatch[1], 10) * 3600;

  const minutesMatch = clean.match(/(\d+)m/);
  if (minutesMatch) total += parseInt(minutesMatch[1], 10) * 60;

  const secondsMatch = clean.match(/(\d+)s/);
  if (secondsMatch) total += parseInt(secondsMatch[1], 10);

  return total;
}
