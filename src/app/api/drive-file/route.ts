import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

/** Fetches a link-shared Google Drive / Docs file as PDF bytes (Google hosts only) so the browser can read its text. */
function exportUrl(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "");
  if (host === "docs.google.com") {
    const m = u.pathname.match(/^\/(document|presentation|spreadsheets)\/d\/([\w-]{10,})/);
    if (!m) return null;
    if (m[1] === "presentation") return `https://docs.google.com/presentation/d/${m[2]}/export/pdf`;
    return `https://docs.google.com/${m[1]}/d/${m[2]}/export?format=pdf`;
  }
  if (host === "drive.google.com") {
    if (/\/folders\//.test(u.pathname)) return null;
    const id = u.pathname.match(/\/file\/d\/([\w-]{10,})/)?.[1] ?? u.searchParams.get("id");
    return id && /^[\w-]{10,}$/.test(id) ? `https://drive.google.com/uc?export=download&id=${id}` : null;
  }
  return null;
}

export async function GET(req: NextRequest) {
  const url = exportUrl(req.nextUrl.searchParams.get("url") ?? "");
  if (!url) return NextResponse.json({ error: "Not a Drive or Docs link." }, { status: 400 });
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok || !(res.headers.get("content-type") || "").includes("pdf"))
      return NextResponse.json({ error: "Couldn't open that link. Share it as 'Anyone with the link'." }, { status: 404 });
    const buf = await res.arrayBuffer();
    if (buf.byteLength > 4_200_000) return NextResponse.json({ error: "That file is too big to fetch from a link." }, { status: 413 });
    return new NextResponse(buf, { headers: { "Content-Type": "application/pdf" } });
  } catch {
    return NextResponse.json({ error: "Couldn't reach Google." }, { status: 502 });
  }
}
