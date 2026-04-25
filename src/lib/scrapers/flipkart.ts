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
          { waitUntil: "domcontentloaded", timeout: 25000 }
        );
        await page.waitForTimeout(3000);

        // page.evaluate must use only inline code — tsx/esbuild injects __name()
        // into named function declarations which breaks in the browser sandbox.
        const found = await page.evaluate((minPrice: number) => {
          const priceEls = Array.from(document.querySelectorAll("div, span")).filter((el) => {
            if (el.children.length > 0) return false;
            return /^₹[\d,]+$/.test((el as HTMLElement).innerText?.trim() || "");
          });

          for (const priceEl of priceEls) {
            const price = parseInt((priceEl as HTMLElement).innerText.replace(/[^0-9]/g, ""));
            if (price < minPrice || price > 1000000) continue;

            // Walk up to find a card container that has BOTH a product link AND an img.
            // Flipkart sometimes wraps only the price section in <a>, with image/title outside.
            let container: Element | null = priceEl.parentElement;
            let link: HTMLAnchorElement | null = null;
            let img: HTMLImageElement | null = null;
            for (let s = 0; container && container !== document.body && s < 15; s++) {
              link = container.querySelector<HTMLAnchorElement>("a[href*='/p/']");
              img = container.querySelector<HTMLImageElement>("img");
              if (link && img) break;
              container = container.parentElement;
            }
            if (!link || !img || !container) continue;

            // Within the card, pick the LOWEST price >= minPrice to get sale price, not MRP.
            let salePrice = price;
            for (const pe of Array.from(container.querySelectorAll("div, span"))) {
              if (pe.children.length > 0) continue;
              const t = (pe as HTMLElement).innerText?.trim() || "";
              if (!/^₹[\d,]+$/.test(t)) continue;
              const p = parseInt(t.replace(/[^0-9]/g, ""));
              if (p >= minPrice && p < salePrice) salePrice = p;
            }

            const imgSrc = img.getAttribute("src") || img.getAttribute("data-src") || "";
            let name = "";
            container.querySelectorAll("div, span, a").forEach((te) => {
              if (te.children.length === 0) {
                const t = (te as HTMLElement).innerText?.trim() || "";
                if (
                  t.length > name.length && t.length > 10 && t.length < 300 &&
                  !t.includes("₹") && !t.includes("%") &&
                  !/^\d+(\.\d+)?$/.test(t) &&
                  !t.toLowerCase().includes("offer")
                ) name = t;
              }
            });
            if (!name) continue;

            let rating: number | null = null;
            for (const le of Array.from(container.querySelectorAll("div, span"))) {
              if (le.children.length > 0) continue;
              const t = (le as HTMLElement).innerText?.trim() || "";
              const r = parseFloat(t);
              if (r >= 1 && r <= 5 && /^\d\.\d$/.test(t)) { rating = r; break; }
            }

            const href = link.getAttribute("href") || "";
            const url = href.startsWith("http") ? href.split("?")[0] : "https://www.flipkart.com" + href.split("?")[0];
            return { name, price: salePrice, url, imageUrl: imgSrc, rating, reviewCount: null };
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
      } catch (err) {
        console.error(`Flipkart error for ${product.fkQuery}:`, err);
      } finally {
        await page.close();
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  } finally {
    await browser.close();
  }

  console.log(`Flipkart: fetched ${results.length} products`);
  return results;
}
