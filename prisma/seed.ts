import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { runAllScrapers } from "../src/lib/scrapers/index";
import { pickBestImage, fetchProductImage } from "../src/lib/scrapers/imageSearch";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function getPriceSlab(price: number): number {
  if (price < 1000) return 100;
  if (price < 10000) return 500;
  if (price < 50000) return 1000;
  if (price < 100000) return 2000;
  return 5000;
}

function generatePriceHistory(productId: string, source: string, basePrice: number) {
  const slab = getPriceSlab(basePrice);
  const cap = basePrice * 0.25; // max drift from base: ±25%
  const entries = [];
  let current = basePrice;

  for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
    const date = new Date();
    date.setDate(date.getDate() - dayOffset);

    // Random walk: -slab, stay (×2 weight), or +slab
    const moves = [-slab, 0, 0, slab];
    const delta = moves[Math.floor(Math.random() * moves.length)];
    current += delta;
    // Clamp within ±25% of base, then round to nearest 100
    current = Math.max(basePrice - cap, Math.min(basePrice + cap, current));
    current = Math.round(current / 100) * 100;

    entries.push({ productId, source, price: current, recordedAt: new Date(date) });
  }
  return entries;
}

// Strip source prefix to get canonical product slug (vs-iphone-15-128gb → iphone-15-128gb)
function normalizeQueryKey(slug: string): string {
  return slug.replace(/^(vs|amz|fk)-/, "");
}

async function main() {
  console.log("🚀 Starting seed with real Indian e-commerce data...\n");

  const products = await runAllScrapers();
  console.log(`\nTotal fetched: ${products.length} items\n`);

  // Group all scraped results by canonical slug first so we can pick the best image
  const grouped = new Map<string, typeof products>();
  for (const p of products) {
    const key = normalizeQueryKey(p.slug);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(p);
  }

  const queryKeyToProductId = new Map<string, string>();
  let created = 0;

  for (const p of products) {
    const queryKey = normalizeQueryKey(p.slug);

    let productId = queryKeyToProductId.get(queryKey);

    if (!productId) {
      const siblings = grouped.get(queryKey) ?? [p];
      let bestImage = pickBestImage(siblings);

      // DDG fallback when no reliable CDN image available
      if (!bestImage) {
        console.log(`  Fetching DDG image for: ${p.name}`);
        bestImage = await fetchProductImage(p.name);
      }

      const product = await prisma.product.upsert({
        where: { slug: queryKey },
        create: {
          name: p.name,
          slug: queryKey,
          category: p.category,
          domain: p.domain,
          brand: p.brand,
          description: p.description,
          imageUrl: bestImage,
        },
        update: {
          brand: p.brand ?? undefined,
          imageUrl: bestImage ?? undefined,
        },
      });
      productId = product.id;
      queryKeyToProductId.set(queryKey, productId);
      created++;
    }

    const existingListing = await prisma.productListing.findUnique({
      where: { productId_source: { productId, source: p.source } },
    });

    await prisma.productListing.upsert({
      where: { productId_source: { productId, source: p.source } },
      create: {
        productId,
        source: p.source,
        sourceId: p.sourceId,
        title: p.name,
        price: p.price,
        currency: p.currency ?? "INR",
        rating: p.rating,
        reviewCount: p.reviewCount,
        imageUrl: p.imageUrl,
        url: p.url,
        inStock: p.inStock,
        description: p.description,
        extraData: p.extraData ? JSON.parse(JSON.stringify(p.extraData)) : undefined,
      },
      update: {
        price: p.price,
        rating: p.rating,
        reviewCount: p.reviewCount,
        inStock: p.inStock,
        extraData: p.extraData ? JSON.parse(JSON.stringify(p.extraData)) : undefined,
        fetchedAt: new Date(),
      },
    });

    if (p.price != null && !existingListing) {
      const history = generatePriceHistory(productId, p.source, p.price);
      await prisma.priceHistory.createMany({ data: history });
      await prisma.priceHistory.create({
        data: { productId, source: p.source, price: p.price },
      });
    }
  }

  const [totalProducts, totalListings, totalHistory] = await Promise.all([
    prisma.product.count(),
    prisma.productListing.count(),
    prisma.priceHistory.count(),
  ]);

  console.log(`\n✅ Seed complete!`);
  console.log(`   Products:         ${totalProducts}`);
  console.log(`   Listings:         ${totalListings}`);
  console.log(`   Price history:    ${totalHistory} entries`);
  console.log(`\n   Sources:`);
  console.log(`   - Vijay Sales:    real INR prices via GraphQL API`);
  console.log(`   - Amazon.in:      real INR prices via product pages`);
  console.log(`   - Flipkart:       real INR prices via DOM scraping`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
