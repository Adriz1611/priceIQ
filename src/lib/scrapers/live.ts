import { chromium } from "playwright";
import type { NormalizedProduct, SourceName } from "./types";

function detectCategory(query: string): { category: string; minPrice: number } {
  const q = query.toLowerCase();
  if (/iphone|samsung.*(galaxy|a\d|s\d)|oneplus|redmi|realme|pixel|motorola|nokia|vivo|iqoo|nothing.*(phone)|smartphone|mobile.*(phone)/i.test(q))
    return { category: "Smartphones", minPrice: 3000 };
  if (/laptop|notebook|macbook|inspiron|pavilion|thinkpad|vivobook|zenbook|ideapad/i.test(q))
    return { category: "Laptops", minPrice: 20000 };
  if (/headphone|earphone|earbud|tws|neckband|speaker|boat|jbl|sony.*(wh|wf)|sennheiser|audio/i.test(q))
    return { category: "Headphones", minPrice: 500 };
  if (/tv|television|led.*(tv|inch)|qled|oled|monitor|display.*inch/i.test(q))
    return { category: "Televisions", minPrice: 10000 };
  if (/tablet|ipad/i.test(q))
    return { category: "Tablets", minPrice: 5000 };
  if (/camera|dslr|mirrorless/i.test(q))
    return { category: "Cameras", minPrice: 10000 };
  if (/watch|smartwatch|band|fitness/i.test(q))
    return { category: "Wearables", minPrice: 500 };
  return { category: "Electronics", minPrice: 500 };
}

function extractBrand(name: string): string {
  const brands = [
    "Apple", "Samsung", "OnePlus", "Xiaomi", "Redmi", "Realme",
    "Google", "Sony", "boAt", "JBL", "Dell", "HP", "Lenovo",
    "Asus", "Acer", "LG", "Motorola", "Nothing", "iQOO", "Vivo",
    "Bose", "Sennheiser", "Noise", "Fastrack", "Titan",
  ];
  for (const b of brands) {
    if (name.toLowerCase().includes(b.toLowerCase())) return b;
  }
  return name.split(" ")[0];
}

function cleanProductName(name: string): string {
  return name
    .replace(/^Store Display Unit\s*[-–]\s*/i, "")
    .replace(/^Renewed\s*[-–]\s*/i, "")
    .replace(/[A-Z][A-Z0-9]{4,}$/, "") // strip Vijay Sales SKU suffix
    .trim();
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60);
}

async function liveVS(
  query: string,
  minPrice: number,
  category: string,
  canonicalSlug: string
): Promise<NormalizedProduct | null> {
  const today = new Date();
  const tp = `${today.getDate()}_${today.getMonth() + 1}_${today.getFullYear()}`;
  const gql = `{products(search:${JSON.stringify(query)},pageSize:5,currentPage:1){items{id name sku url_key review_count rating_summary price_range{maximum_price{final_price{value}}} image{url} mrp}}}`;
  const url = `https://vsprod.vijaysales.com/graphql?query=${encodeURIComponent(gql)}&tp=${tp}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json", "Accept-Language": "en-IN,en;q=0.9" },
  });
  const data = await res.json() as { data?: { products?: { items?: unknown[] } } };
  const items = (data?.data?.products?.items ?? []) as {
    name: string; sku: string; url_key: string;
    review_count: number; rating_summary: number;
    price_range: { maximum_price: { final_price: { value: number } } };
    image: { url: string }; mrp?: number;
  }[];

  const item = items.find((i) => {
    const p = i.price_range?.maximum_price?.final_price?.value;
    return p != null && p >= minPrice;
  });
  if (!item) return null;

  const price = item.price_range?.maximum_price?.final_price?.value;
  const cleanName = cleanProductName(item.name);

  return {
    name: cleanName,
    slug: `vs-${canonicalSlug}`,
    category,
    domain: "electronics",
    brand: extractBrand(cleanName),
    source: "vijaysales" as SourceName,
    sourceId: item.sku,
    price,
    currency: "INR",
    rating: item.rating_summary ? item.rating_summary / 20 : undefined,
    reviewCount: item.review_count || undefined,
    url: `https://www.vijaysales.com/${item.url_key}`,
    imageUrl: item.image?.url || undefined,
    inStock: true,
    extraData: item.mrp ? { mrp: item.mrp } : undefined,
  };
}

const AMZ_HEADERS = {
  "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-IN,en;q=0.9",
};

async function liveAmazon(
  query: string,
  minPrice: number,
  category: string,
  canonicalSlug: string
): Promise<NormalizedProduct | null> {
  const searchRes = await fetch(`https://www.amazon.in/s?k=${encodeURIComponent(query)}`, { headers: AMZ_HEADERS });
  const html = await searchRes.text();
  const matches = [...html.matchAll(/data-asin="([A-Z0-9]{10})"/g)];
  const seen = new Set<string>();
  const asins: string[] = [];
  for (const m of matches) {
    if (!seen.has(m[1])) { seen.add(m[1]); asins.push(m[1]); }
    if (asins.length >= 6) break;
  }

  for (const asin of asins) {
    await new Promise((r) => setTimeout(r, 400));
    const pRes = await fetch(`https://www.amazon.in/dp/${asin}`, { headers: AMZ_HEADERS });
    if (!pRes.ok) continue;
    const pHtml = await pRes.text();

    const title = pHtml.match(/<span id="productTitle"[^>]*>([^<]+)/)?.[1]?.trim();
    const priceStr = pHtml.match(/<span class="a-price-whole">([0-9,]+)/)?.[1]?.replace(/,/g, "");
    const price = priceStr ? parseFloat(priceStr) : null;
    if (!title || !price || price < minPrice) continue;

    const ratingStr = pHtml.match(/([0-9.]+) out of 5 stars/)?.[1];
    const reviewStr = pHtml.match(/([0-9,]+) ratings/)?.[1]?.replace(/,/g, "");
    const imageUrl = pHtml.match(/"large":"(https:\/\/m\.media-amazon\.com\/images\/[^"]+)"/)?.[1];
    const brandText = pHtml.match(/<a id="bylineInfo"[^>]*>([^<]+)/)?.[1]?.trim();
    const brand = brandText?.replace(/^Visit the /, "").replace(/ Store$/, "") ?? undefined;
    const cleanTitle = cleanProductName(title);
    const inStock = !pHtml.includes("Currently unavailable") && !pHtml.includes("unavailableBlock");

    return {
      name: cleanTitle,
      slug: `amz-${canonicalSlug}`,
      category,
      domain: "electronics",
      brand: brand ? extractBrand(brand) : extractBrand(cleanTitle),
      source: "amazon" as SourceName,
      sourceId: asin,
      price,
      currency: "INR",
      rating: ratingStr ? parseFloat(ratingStr) : undefined,
      reviewCount: reviewStr ? parseInt(reviewStr) : undefined,
      url: `https://www.amazon.in/dp/${asin}`,
      imageUrl: imageUrl ?? undefined,
      inStock,
    };
  }
  return null;
}

async function liveFlipkart(
  query: string,
  minPrice: number,
  category: string,
  canonicalSlug: string
): Promise<NormalizedProduct | null> {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"],
  });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    locale: "en-IN",
    viewport: { width: 1366, height: 768 },
    extraHTTPHeaders: { "Accept-Language": "en-IN,en;q=0.9" },
  });
  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    // @ts-ignore
    window.chrome = { runtime: {} };
  });

  try {
    const page = await ctx.newPage();
    await page.goto(`https://www.flipkart.com/search?q=${encodeURIComponent(query)}&sort=popularity`, {
      waitUntil: "networkidle",
      timeout: 20000,
    });

    const found = await page.evaluate((minP: number) => {
      const priceEls = document.querySelectorAll(".hZ3P6w, .Nx9bqj, ._30jeq3");
      for (const priceEl of priceEls) {
        let el: Element | null = priceEl.parentElement;
        for (let i = 0; i < 10 && el; i++) {
          const link = el.querySelector<HTMLAnchorElement>("a[href*='/p/']");
          const img = el.querySelector<HTMLImageElement>("img");
          if (link && img) {
            const price = parseInt(priceEl.textContent?.replace(/[^0-9]/g, "") || "0");
            if (price < minP) break;
            const textEls = el.querySelectorAll("a, div, span");
            let longestText = "";
            textEls.forEach((te) => {
              if (te.children.length === 0) {
                const t = (te as HTMLElement).innerText?.trim() || "";
                if (t.length > longestText.length && t.length < 200 && !t.includes("₹") && !t.includes("Rating")) longestText = t;
              }
            });
            const ratingEl = el.querySelector<HTMLElement>(".XQDdHH, ._3LWZlK, .WkcPbg");
            return {
              name: longestText,
              price,
              url: "https://www.flipkart.com" + link.getAttribute("href")!.split("?")[0],
              imageUrl: img.getAttribute("src") || "",
              rating: ratingEl?.innerText ? parseFloat(ratingEl.innerText) : null,
            };
          }
          el = el.parentElement;
        }
      }
      return null;
    }, minPrice);

    await page.close();
    if (!found?.name || !found.price) return null;

    const cleanName = cleanProductName(found.name);
    return {
      name: cleanName,
      slug: `fk-${canonicalSlug}`,
      category,
      domain: "electronics",
      brand: extractBrand(cleanName),
      source: "flipkart" as SourceName,
      sourceId: found.url.split("/p/")[1]?.split("?")[0] || canonicalSlug,
      price: found.price,
      currency: "INR",
      rating: found.rating ?? undefined,
      url: found.url,
      imageUrl: found.imageUrl || undefined,
      inStock: true,
    };
  } finally {
    await browser.close();
  }
}

export interface LiveSearchResult {
  products: NormalizedProduct[];
  canonicalSlug: string;
  category: string;
}

export async function liveSearch(query: string): Promise<LiveSearchResult> {
  const { category, minPrice } = detectCategory(query);
  const canonicalSlug = slugify(query);

  // Run VS and Amazon in parallel, Flipkart separately (needs browser)
  const [vsResult, amzResult] = await Promise.allSettled([
    liveVS(query, minPrice, category, canonicalSlug),
    liveAmazon(query, minPrice, category, canonicalSlug),
  ]);

  const fkResult = await liveFlipkart(query, minPrice, category, canonicalSlug).catch(() => null);

  const products: NormalizedProduct[] = [
    vsResult.status === "fulfilled" ? vsResult.value : null,
    amzResult.status === "fulfilled" ? amzResult.value : null,
    fkResult,
  ].filter((p): p is NormalizedProduct => p != null);

  return { products, canonicalSlug, category };
}
