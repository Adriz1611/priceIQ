import { PRODUCTS } from "./products";
import type { NormalizedProduct, SourceName } from "./types";
import { parseQuery, scoreCandidate } from "./matcher";

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

export async function scrapeVijaySales(): Promise<NormalizedProduct[]> {
  const results: NormalizedProduct[] = [];
  const today = new Date();
  const tp = `${today.getDate()}_${today.getMonth() + 1}_${today.getFullYear()}`;

  for (const product of PRODUCTS) {
    try {
      const gqlQuery = `{products(search:${JSON.stringify(product.vsQuery)},pageSize:5,currentPage:1){items{id name sku url_key review_count rating_summary price_range{maximum_price{final_price{currency value}}} image{url} mrp}}}`;
      const url = `https://vsprod.vijaysales.com/graphql?query=${encodeURIComponent(gqlQuery)}&tp=${tp}`;

      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
          "Accept": "application/json",
          "Accept-Language": "en-IN,en;q=0.9",
        },
      });

      const data = await res.json() as { data?: { products?: { items?: unknown[] } } };
      const items = (data?.data?.products?.items ?? []) as {
        id: number;
        name: string;
        sku: string;
        url_key: string;
        review_count: number;
        rating_summary: number;
        price_range: { maximum_price: { final_price: { value: number } } };
        image: { url: string };
        mrp?: number;
      }[];

      if (!items.length) continue;

      const parsedQ = parseQuery(product.vsQuery, product.category, product.minPrice);

      let bestScore = -Infinity;
      let bestItem: typeof items[0] | null = null;
      let bestCleanName = "";

      for (const item of items) {
        const price = item.price_range?.maximum_price?.final_price?.value;
        if (!price || price < product.minPrice) continue;

        // VS appends internal SKU codes to product names — strip them
        const cleanName = item.name.replace(/[A-Z][A-Z0-9]{4,}$/, "").trim();
        const match = scoreCandidate(cleanName, parsedQ);
        console.log(`VS [${product.slug}] "${cleanName}" → score=${match.score} (${match.reasons.join(", ")})`);

        if (match.accepted && (
          match.score > bestScore ||
          (match.score === bestScore && (item.review_count ?? 0) > (bestItem?.review_count ?? 0))
        )) {
          bestScore = match.score;
          bestItem = item;
          bestCleanName = cleanName;
        }
      }

      if (!bestItem) {
        console.warn(`VS: no accepted candidate for "${product.vsQuery}" (all ${items.length} rejected)`);
        continue;
      }

      const price = bestItem.price_range?.maximum_price?.final_price?.value;
      results.push({
        name: bestCleanName,
        slug: `vs-${product.slug}`,
        category: product.category,
        domain: "electronics",
        brand: extractBrand(bestCleanName),
        source: "vijaysales" as SourceName,
        sourceId: String(bestItem.sku),
        price,
        currency: "INR",
        rating: bestItem.rating_summary ? bestItem.rating_summary / 20 : undefined,
        reviewCount: bestItem.review_count || undefined,
        url: `https://www.vijaysales.com/${bestItem.url_key}`,
        imageUrl: bestItem.image?.url
          ? bestItem.image.url.startsWith("http")
            ? bestItem.image.url
            : `https://www.vijaysales.com${bestItem.image.url}`
          : undefined,
        inStock: true,
        extraData: bestItem.mrp ? { mrp: bestItem.mrp } : undefined,
      });
    } catch (err) {
      console.error(`VS error for "${product.vsQuery}":`, err);
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`Vijay Sales: fetched ${results.length} products`);
  return results;
}
