import { describe, it, expect } from "vitest";
import { parseYouTubeUrl } from "./parser";

describe("parseYouTubeUrl", () => {
  it("parses standard watch?v= links", () => {
    const res = parseYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(res.isValid).toBe(true);
    expect(res.videoId).toBe("dQw4w9WgXcQ");
    expect(res.startTimeSeconds).toBe(0);
  });

  it("parses youtu.be short links", () => {
    const res = parseYouTubeUrl("https://youtu.be/dQw4w9WgXcQ");
    expect(res.isValid).toBe(true);
    expect(res.videoId).toBe("dQw4w9WgXcQ");
  });

  it("parses youtube.com/shorts/ links", () => {
    const res = parseYouTubeUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ");
    expect(res.isValid).toBe(true);
    expect(res.videoId).toBe("dQw4w9WgXcQ");
  });

  it("parses youtube.com/embed/ links", () => {
    const res = parseYouTubeUrl("https://www.youtube.com/embed/dQw4w9WgXcQ");
    expect(res.isValid).toBe(true);
    expect(res.videoId).toBe("dQw4w9WgXcQ");
  });

  it("ignores extra tracking parameters (si, feature, list when v exists)", () => {
    const res = parseYouTubeUrl(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ&si=Abc123_xyz&feature=shared"
    );
    expect(res.isValid).toBe(true);
    expect(res.videoId).toBe("dQw4w9WgXcQ");
  });

  it("extracts start time with t= and start= (numeric and units)", () => {
    const res1 = parseYouTubeUrl("https://youtu.be/dQw4w9WgXcQ?t=90");
    expect(res1.startTimeSeconds).toBe(90);

    const res2 = parseYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&start=45");
    expect(res2.startTimeSeconds).toBe(45);

    const res3 = parseYouTubeUrl("https://youtu.be/dQw4w9WgXcQ?t=1m30s");
    expect(res3.startTimeSeconds).toBe(90);

    const res4 = parseYouTubeUrl("https://youtu.be/dQw4w9WgXcQ?t=1h10m5s");
    expect(res4.startTimeSeconds).toBe(3600 + 600 + 5);
  });

  it("flags playlist-only links with the exact required message", () => {
    const res = parseYouTubeUrl("https://www.youtube.com/playlist?list=PLbpi6ZahtOH6e_38bO7C1590_75b_W318");
    expect(res.isValid).toBe(false);
    expect(res.isPlaylistOnly).toBe(true);
    expect(res.error).toBe("Playlist links are not supported. Paste individual video links.");
  });

  it("rejects non-youtube links", () => {
    const res = parseYouTubeUrl("https://vimeo.com/123456789");
    expect(res.isValid).toBe(false);
    expect(res.error).toBe("Not a valid YouTube domain");
  });

  it("rejects malformed or empty links", () => {
    expect(parseYouTubeUrl("").isValid).toBe(false);
    expect(parseYouTubeUrl("not-a-valid-url").isValid).toBe(false);
    expect(parseYouTubeUrl("https://www.youtube.com/watch?v=too_short").isValid).toBe(false);
  });

  it("accepts a raw 11-character video ID directly", () => {
    const res = parseYouTubeUrl("tpIctyqH29Q");
    expect(res.isValid).toBe(true);
    expect(res.videoId).toBe("tpIctyqH29Q");
  });
});
