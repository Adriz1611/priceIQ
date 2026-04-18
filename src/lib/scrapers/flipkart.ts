import { chromium } from "playwright";
import { PRODUCTS } from "./products";
import type { NormalizedProduct, SourceName } from "./types";

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

export async function scrapeFlipkart(): Promise<NormalizedProduct[]> {
  const results: NormalizedProduct[] = [];

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"],
  });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    locale: "en-IN",
    viewport: { width: 1366, height: 768 },
    extraHTTPHeaders: { "Accept-Language": "en-IN,en;q=0.9" },
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    // @ts-ignore
    window.chrome = { runtime: {} };
  });

  try {
    for (const product of PRODUCTS) {
      const page = await context.newPage();
      try {
        await page.goto(
          `https://www.flipkart.com/search?q=${encodeURIComponent(product.fkQuery)}&sort=popularity`,
          { waitUntil: "networkidle", timeout: 20000 }
        );

        const found = await page.evaluate((minPrice: number) => {
          const priceEls = document.querySelectorAll(".hZ3P6w, .Nx9bqj, ._30jeq3");
          for (const priceEl of priceEls) {
            let el: Element | null = priceEl.parentElement;
            for (let i = 0; i < 10 && el; i++) {
              const link = el.querySelector<HTMLAnchorElement>("a[href*='/p/']");
              const img = el.querySelector<HTMLImageElement>("img");
              if (link && img) {
                const price = parseInt(priceEl.textContent?.replace(/[^0-9]/g, "") || "0");
                if (price < minPrice) break;

                const textEls = el.querySelectorAll("a, div, span");
                let longestText = "";
                textEls.forEach((te) => {
                  if (te.children.length === 0) {
                    const t = (te as HTMLElement).innerText?.trim() || "";
                    if (t.length > longestText.length && t.length < 200 && !t.includes("₹") && !t.includes("Rating")) {
                      longestText = t;
                    }
                  }
                });

                const rating = el.querySelector<HTMLElement>(".XQDdHH, ._3LWZlK, .WkcPbg");
                const reviewEl = el.querySelector<HTMLElement>(".Wphh3N, ._2_R_DZ");
                const reviewText = reviewEl?.innerText?.replace(/[^0-9]/g, "") || null;

                return {
                  name: longestText,
                  price,
                  url: "https://www.flipkart.com" + link.getAttribute("href")!.split("?")[0],
                  imageUrl: img.getAttribute("src") || "",
                  rating: rating?.innerText ? parseFloat(rating.innerText) : null,
                  reviewCount: reviewText ? parseInt(reviewText) : null,
                };
              }
              el = el.parentElement;
            }
          }
          return null;
        }, product.minPrice);

        if (found?.name && found.price) {
          results.push({
            name: cleanName(found.name),
            slug: `fk-${product.slug}`,
            category: product.category,
            domain: "electronics",
            brand: extractBrand(found.name),
            source: "flipkart" as SourceName,
            sourceId: found.url.split("/p/")[1]?.split("?")[0] || product.slug,
            price: found.price,
            currency: "INR",
            rating: found.rating ?? undefined,
            reviewCount: found.reviewCount ?? undefined,
            url: found.url,
            imageUrl: found.imageUrl || undefined,
            inStock: true,
          });
        }
      } catch {
        // skip failed query
      } finally {
        await page.close();
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
  } finally {
    await browser.close();
  }

  console.log(`Flipkart: fetched ${results.length} products`);
  return results;
}
