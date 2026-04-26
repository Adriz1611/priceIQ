import { PRODUCTS } from "./products";
import type { NormalizedProduct, SourceName } from "./types";
import { parseQuery, scoreCandidate } from "./matcher";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-IN,en;q=0.9",
};

function cleanName(name: string): string {
  return name
    .replace(/^Store Display Unit\s*[-–]\s*/i, "")
    .replace(/^Renewed\s*[-–]\s*/i, "")
    .trim();
}

function extractBrand(name: string): string {
  const brands = [
    "Apple", "Samsung", "OnePlus", "Xiaomi", "Redmi", "Realme",
    "Google", "Sony", "boAt", "JBL", "Dell", "HP", "Lenovo",
    "Asus", "Acer", "LG", "Motorola", "Nothing", "iQOO", "Vivo",
  ];
  for (const b of brands) {
    if (name.toLowerCase().includes(b.toLowerCase())) return b;
  }
  return name.split(" ")[0];
}

async function fetchAsins(query: string): Promise<string[]> {
  const url = `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: HEADERS });
  const html = await res.text();
  const matches = [...html.matchAll(/data-asin="([A-Z0-9]{10})"/g)];
  const seen = new Set<string>();
  const asins: string[] = [];
  for (const m of matches) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      asins.push(m[1]);
    }
    if (asins.length >= 10) break;
  }
  return asins;
}

async function fetchProductPage(asin: string): Promise<{
  title: string | null;
  price: number | null;
  rating: number | null;
  reviewCount: number | null;
  imageUrl: string | null;
  brand: string | null;
  inStock: boolean;
} | null> {
  const res = await fetch(`https://www.amazon.in/dp/${asin}`, { headers: HEADERS });
  if (!res.ok) return null;
  const html = await res.text();

  const title = html.match(/<span id="productTitle"[^>]*>([^<]+)/)?.[1]?.trim() ?? null;
  const priceStr = html.match(/<span class="a-price-whole">([0-9,]+)/)?.[1]?.replace(/,/g, "") ?? null;
  const price = priceStr ? parseFloat(priceStr) : null;
  const ratingStr = html.match(/([0-9.]+) out of 5 stars/)?.[1];
  const rating = ratingStr ? parseFloat(ratingStr) : null;
  const reviewCountStr = html.match(/([0-9,]+) ratings/)?.[1]?.replace(/,/g, "") ?? null;
  const reviewCount = reviewCountStr ? parseInt(reviewCountStr) : null;
  const imageUrl = html.match(/"large":"(https:\/\/m\.media-amazon\.com\/images\/[^"]+)"/)?.[1] ?? null;
  const brandText = html.match(/<a id="bylineInfo"[^>]*>([^<]+)/)?.[1]?.trim() ?? null;
  const brand = brandText?.replace(/^Visit the /, "").replace(/ Store$/, "") ?? null;
  const inStock =
    html.includes('id="add-to-cart-button"') ||
    html.includes('name="submit.add-to-cart"') ||
    html.includes('"availability":"https://schema.org/InStock"');

  return { title, price, rating, reviewCount, imageUrl, brand, inStock };
}

export async function scrapeAmazon(): Promise<NormalizedProduct[]> {
  const results: NormalizedProduct[] = [];

  for (const product of PRODUCTS) {
    try {
      const asins = await fetchAsins(product.amzQuery);
      if (!asins.length) continue;

      const parsedQ = parseQuery(product.amzQuery, product.category, product.minPrice);

      let bestScore = -Infinity;
      let bestPage: Awaited<ReturnType<typeof fetchProductPage>> = null;
      let bestAsin = "";

      for (const asin of asins) {
        await new Promise((r) => setTimeout(r, 600));
        const p = await fetchProductPage(asin);
        if (!p?.title || !p.price || p.price < product.minPrice) continue;

        const match = scoreCandidate(p.title, parsedQ);
        console.log(`AMZ [${product.slug}] "${p.title.slice(0, 60)}" → score=${match.score} (${match.reasons.join(", ")})`);

        if (match.accepted && match.score > bestScore) {
          bestScore = match.score;
          bestPage = p;
          bestAsin = asin;
        }
      }

      if (!bestPage?.title) {
        console.warn(`Amazon: no accepted candidate for "${product.amzQuery}" (checked ${asins.length} ASINs)`);
        continue;
      }

      results.push({
        name: cleanName(bestPage.title),
        slug: `amz-${product.slug}`,
        category: product.category,
        domain: "electronics",
        brand: bestPage.brand ? extractBrand(bestPage.brand) : extractBrand(bestPage.title),
        source: "amazon" as SourceName,
        sourceId: bestAsin,
        price: bestPage.price ?? undefined,
        currency: "INR",
        rating: bestPage.rating ?? undefined,
        reviewCount: bestPage.reviewCount ?? undefined,
        url: `https://www.amazon.in/dp/${bestAsin}`,
        imageUrl: bestPage.imageUrl ?? undefined,
        inStock: bestPage.inStock,
      });
    } catch (err) {
      console.error(`Amazon error for "${product.amzQuery}":`, err);
    }
    await new Promise((r) => setTimeout(r, 800));
  }

  console.log(`Amazon.in: fetched ${results.length} products`);
  return results;
}
