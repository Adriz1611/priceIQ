import { chromium } from "playwright";
import { PRODUCTS } from "./products";
import type { NormalizedProduct, SourceName } from "./types";
import { parseQuery, scoreCandidate } from "./matcher";

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

        // Collect up to 5 candidate cards from the search page.
        // Scoring happens in Node.js after evaluate returns — do NOT add named
        // function declarations here; esbuild injects __name() which breaks in
        // the browser sandbox.
        const candidates = await page.evaluate((minP: number) => {
          const res: { name: string; price: number; url: string; imageUrl: string; rating: number | null }[] = [];
          const seenUrls = new Set<string>();

          const priceEls = Array.from(document.querySelectorAll("div, span")).filter((el) => {
            if (el.children.length > 0) return false;
            return /^₹[\d,]+$/.test((el as HTMLElement).innerText?.trim() || "");
          });

          for (const priceEl of priceEls) {
            if (res.length >= 5) break;

            const price = parseInt((priceEl as HTMLElement).innerText.replace(/[^0-9]/g, ""));
            if (price < minP || price > 1000000) continue;

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

            const href = link.getAttribute("href") || "";
            const url = href.startsWith("http")
              ? href.split("?")[0]
              : "https://www.flipkart.com" + href.split("?")[0];
            if (seenUrls.has(url)) continue;
            seenUrls.add(url);

            // Pick the lowest price within the card (sale price, not MRP)
            let salePrice = price;
            for (const pe of Array.from(container.querySelectorAll("div, span"))) {
              if (pe.children.length > 0) continue;
              const t = (pe as HTMLElement).innerText?.trim() || "";
              if (!/^₹[\d,]+$/.test(t)) continue;
              const p = parseInt(t.replace(/[^0-9]/g, ""));
              if (p >= minP && p < salePrice) salePrice = p;
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

            res.push({ name, price: salePrice, url, imageUrl: imgSrc, rating });
          }
          return res;
        }, product.minPrice);

        // Score all candidates in Node.js and pick the highest-accepted one
        const parsedQ = parseQuery(product.fkQuery, product.category, product.minPrice);
        let bestScore = -Infinity;
        let best: typeof candidates[0] | null = null;

        for (const c of candidates) {
          const match = scoreCandidate(c.name, parsedQ);
          console.log(`FK [${product.slug}] "${c.name.slice(0, 60)}" → score=${match.score} (${match.reasons.join(", ")})`);
          if (match.accepted && match.score > bestScore) {
            bestScore = match.score;
            best = c;
          }
        }

        if (!best?.name) {
          console.warn(`Flipkart: no accepted candidate for "${product.fkQuery}" (${candidates.length} cards checked)`);
        } else {
          results.push({
            name: cleanName(best.name),
            slug: `fk-${product.slug}`,
            category: product.category,
            domain: "electronics",
            brand: extractBrand(best.name),
            source: "flipkart" as SourceName,
            sourceId: best.url.split("/p/")[1]?.split("?")[0] || product.slug,
            price: best.price,
            currency: "INR",
            rating: best.rating ?? undefined,
            url: best.url,
            imageUrl: best.imageUrl || undefined,
            inStock: true,
          });
        }
      } catch (err) {
        console.error(`Flipkart error for "${product.fkQuery}":`, err);
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
