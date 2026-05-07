import type { NormalizedProduct } from "./types";

/**
 * Pick the best available image from scraped results.
 * Amazon CDN images are most reliable; fall back to Flipkart, then VS.
 */
export function pickBestImage(products: NormalizedProduct[]): string | null {
  for (const source of ["amazon", "flipkart", "vijaysales"] as const) {
    const img = products.find((p) => p.source === source)?.imageUrl;
    if (img && img.startsWith("http")) return img;
  }
  // Any non-null image as last resort
  return products.find((p) => p.imageUrl?.startsWith("http"))?.imageUrl ?? null;
}

/**
 * Fetch a product image from DuckDuckGo image search (no API key needed).
 * Returns null on any failure — callers should treat this as best-effort.
 */
export async function fetchProductImage(name: string): Promise<string | null> {
  try {
    const q = encodeURIComponent(name + " product");

    // Step 1: get the vqd token
    const homeRes = await fetch(
      `https://duckduckgo.com/?q=${q}&iax=images&ia=images`,
      { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(8000) }
    );
    const homeHtml = await homeRes.text();
    const vqdMatch = homeHtml.match(/vqd=['"]([^'"]+)['"]/);
    if (!vqdMatch) return null;
    const vqd = vqdMatch[1];

    // Step 2: fetch image results
    const imgRes = await fetch(
      `https://duckduckgo.com/i.js?q=${q}&vqd=${vqd}&f=,,,&p=1`,
      { headers: { "User-Agent": "Mozilla/5.0", Referer: "https://duckduckgo.com/" }, signal: AbortSignal.timeout(8000) }
    );
    const json = await imgRes.json() as { results?: { image: string }[] };
    const firstResult = json.results?.[0]?.image;
    return firstResult ?? null;
  } catch {
    return null;
  }
}
