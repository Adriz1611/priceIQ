import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runAllScrapers } from "@/lib/scrapers";

// Server-side scrape trigger — reads SCRAPE_SECRET from env so the client
// never needs to know the secret. Only the dashboard button uses this route.
export async function POST() {
  const products = await runAllScrapers();
  let upserted = 0;

  const slugToProductId = new Map<string, string>();

  for (const p of products) {
    const canonicalSlug = p.slug.replace(/^(vs|amz|fk)-/, "");

    let productId = slugToProductId.get(canonicalSlug);
    if (!productId) {
      const product = await prisma.product.upsert({
        where: { slug: canonicalSlug },
        create: {
          name: p.name,
          slug: canonicalSlug,
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
      slugToProductId.set(canonicalSlug, productId);
    }

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
      },
      update: {
        price: p.price,
        rating: p.rating,
        inStock: p.inStock,
        fetchedAt: new Date(),
      },
    });

    if (p.price != null) {
      await prisma.priceHistory.create({
        data: { productId, source: p.source, price: p.price },
      });
    }

    upserted++;
  }

  return NextResponse.json({ success: true, upserted });
}
