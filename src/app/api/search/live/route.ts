import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { liveSearch } from "@/lib/scrapers/live";
import { analyzeProduct } from "@/lib/ai/groq";

export async function POST(req: NextRequest) {
  const { query } = await req.json() as { query: string };
  if (!query?.trim()) {
    return NextResponse.json({ success: false, error: "query required" }, { status: 400 });
  }

  const { products, canonicalSlug, category } = await liveSearch(query.trim());
  if (!products.length) {
    return NextResponse.json({ success: false, error: "No products found" }, { status: 404 });
  }

  // Upsert the canonical product
  const product = await prisma.product.upsert({
    where: { slug: canonicalSlug },
    create: {
      name: products[0].name,
      slug: canonicalSlug,
      category,
      domain: "electronics",
      brand: products[0].brand,
      imageUrl: products[0].imageUrl,
    },
    update: {
      brand: products[0].brand ?? undefined,
      imageUrl: products[0].imageUrl ?? undefined,
    },
  });

  for (const p of products) {
    await prisma.productListing.upsert({
      where: { productId_source: { productId: product.id, source: p.source } },
      create: {
        productId: product.id,
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
        rating: p.rating ?? undefined,
        inStock: p.inStock,
        fetchedAt: new Date(),
      },
    });

    if (p.price != null) {
      await prisma.priceHistory.create({
        data: { productId: product.id, source: p.source, price: p.price },
      });
    }
  }

  // Generate AI analysis
  let aiAnalysis: { summary: string; recommendation: string; bestSource: string; confidenceNote: string | null } | null = null;
  try {
    const listingSummaries = products
      .filter((p) => p.price != null)
      .map((p) => ({
        source: p.source,
        price: p.price,
        currency: "INR",
        rating: p.rating,
        reviewCount: p.reviewCount,
        inStock: p.inStock,
      }));
    if (listingSummaries.length) {
      aiAnalysis = await analyzeProduct(products[0].name, category, "electronics", listingSummaries);
      const existing = await prisma.aIAnalysis.findFirst({ where: { productId: product.id } });
      if (existing) {
        await prisma.aIAnalysis.update({
          where: { id: existing.id },
          data: { summary: aiAnalysis.summary, recommendation: aiAnalysis.recommendation, bestSource: aiAnalysis.bestSource },
        });
      } else {
        await prisma.aIAnalysis.create({
          data: {
            productId: product.id,
            summary: aiAnalysis.summary,
            recommendation: aiAnalysis.recommendation,
            bestSource: aiAnalysis.bestSource,
          },
        });
      }
    }
  } catch {
    // AI is best-effort
  }

  return NextResponse.json({ success: true, productId: product.id, aiAnalysis });
}
