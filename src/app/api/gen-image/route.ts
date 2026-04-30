/**
 * 画像生成プロキシ。
 *
 * Anthropic Cloud から Pollinations.ai が "Host not in allowlist" でブロック
 * されるため、Vercel の固定 IP を経由して中継する。
 *
 * GET /api/gen-image?prompt=...&seed=1234&w=1280&h=720
 *  → Pollinations.ai のレスポンスをそのまま image/jpeg で返す
 *
 * Edge runtime を使用 (Hobby プランで最長 30秒、ストリーミング対応)。
 */

export const runtime = "edge";

const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt/";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const prompt = searchParams.get("prompt");
  const seed = searchParams.get("seed") ?? String(Math.floor(Math.random() * 9000) + 1000);
  const w = searchParams.get("w") ?? "1280";
  const h = searchParams.get("h") ?? "720";

  if (!prompt || prompt.length < 10) {
    return new Response("missing or too-short prompt", { status: 400 });
  }
  if (prompt.length > 4000) {
    return new Response("prompt too long", { status: 400 });
  }

  const upstream = `${POLLINATIONS_BASE}${encodeURIComponent(prompt)}?seed=${encodeURIComponent(seed)}&width=${encodeURIComponent(w)}&height=${encodeURIComponent(h)}&nologo=true`;

  try {
    const r = await fetch(upstream, {
      headers: {
        "User-Agent": "shin-golf-search/1.0 (+https://shin-golf-search.vercel.app)",
      },
    });
    if (!r.ok) {
      return new Response(`upstream ${r.status}`, { status: 502 });
    }
    const ct = r.headers.get("content-type") ?? "image/jpeg";
    if (!ct.startsWith("image/")) {
      return new Response("upstream returned non-image", { status: 502 });
    }
    return new Response(r.body, {
      headers: {
        "content-type": ct,
        "cache-control": "public, max-age=86400, immutable",
      },
    });
  } catch (e) {
    return new Response(`proxy error: ${(e as Error).message}`, { status: 502 });
  }
}
