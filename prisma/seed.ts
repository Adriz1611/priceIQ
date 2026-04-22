import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { runAllScrapers } from "../src/lib/scrapers/index";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function generatePriceHistory(productId: string, source: string, basePrice: number) {
  const entries = [];
  for (let dayOffset = 30; dayOffset >= 1; dayOffset--) {
    const date = new Date();
    date.setDate(date.getDate() - dayOffset);
    const drift = 1 + (Math.random() * 0.08 - 0.04);
    const price = Math.round(basePrice * drift);
    entries.push({ productId, source, price, recordedAt: date });
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

  // Group by normalized query slug: vs-iphone-15-128gb, amz-iphone-15-128gb, fk-iphone-15-128gb
  // all map to "iphone15128gb"
  const queryKeyToProductId = new Map<string, string>();
  let created = 0;

  for (const p of products) {
    const queryKey = normalizeQueryKey(p.slug);

    let productId = queryKeyToProductId.get(queryKey);

    if (!productId) {
      const product = await prisma.product.upsert({
        where: { slug: queryKey },
        create: {
          name: p.name,
          slug: queryKey,
          category: p.category,
          domain: p.domain,
          brand: p.brand,
          description: p.description,
          imageUrl: p.imageUrl,
        },
        update: {
          brand: p.brand ?? undefined,
          imageUrl: p.imageUrl ?? undefined,
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
