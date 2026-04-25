import { PRODUCTS } from "./products";
import type { NormalizedProduct, SourceName } from "./types";

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

      // Skip items with price below minPrice (probably accessories)
      const item = items.find((i) => {
        const p = i.price_range?.maximum_price?.final_price?.value;
        return p != null && p >= product.minPrice;
      }) ?? items[0];

      const price = item.price_range?.maximum_price?.final_price?.value;
      if (!price || price < product.minPrice) continue;

      // Vijay Sales appends SKU to product names (e.g. "Apple iPhone 15P220946") — strip it
      const cleanName = item.name.replace(/[A-Z][A-Z0-9]{4,}$/, "").trim();
      const brand = extractBrand(cleanName);

      results.push({
        name: cleanName,
        slug: `vs-${product.slug}`,
        category: product.category,
        domain: "electronics",
        brand,
        source: "vijaysales" as SourceName,
        sourceId: String(item.sku),
        price,
        currency: "INR",
        rating: item.rating_summary ? item.rating_summary / 20 : undefined,
        reviewCount: item.review_count || undefined,
        url: `https://www.vijaysales.com/${item.url_key}`,
        imageUrl: item.image?.url
          ? item.image.url.startsWith("http")
            ? item.image.url
            : `https://www.vijaysales.com${item.image.url}`
          : undefined,
        inStock: true,
        extraData: item.mrp ? { mrp: item.mrp } : undefined,
      });
    } catch {
      // skip failed query
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`Vijay Sales: fetched ${results.length} products`);
  return results;
}
