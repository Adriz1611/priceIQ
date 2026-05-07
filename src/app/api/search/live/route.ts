export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { liveSearch } from "@/lib/scrapers/live";
import { analyzeProduct, generateProductSummary } from "@/lib/ai/groq";
import { seedPriceHistory } from "@/lib/priceHistoryGen";
import { pickBestImage, fetchProductImage } from "@/lib/scrapers/imageSearch";

export async function POST(req: NextRequest) {
  let query: string;
  try {
    const body = await req.json() as { query?: string };
    query = body?.query ?? "";
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!query.trim()) {
    return NextResponse.json({ success: false, error: "query required" }, { status: 400 });
  }

  let products: Awaited<ReturnType<typeof liveSearch>>["products"];
  let canonicalSlug: string;
  let category: string;
  try {
    ({ products, canonicalSlug, category } = await liveSearch(query.trim()));
  } catch (err) {
    console.error("liveSearch error:", err);
    return NextResponse.json({ success: false, error: "Search failed" }, { status: 502 });
  }

  if (!products.length) {
    return NextResponse.json({ success: false, error: "No products found" }, { status: 404 });
  }

  // Pick the best available image (Amazon > Flipkart > VS) then DDG fallback
  const bestImage = pickBestImage(products);

  // Upsert the canonical product
  const product = await prisma.product.upsert({
    where: { slug: canonicalSlug },
    create: {
      name: products[0].name,
      slug: canonicalSlug,
      category,
      domain: "electronics",
      brand: products[0].brand,
      imageUrl: bestImage,
    },
    update: {
      brand: products[0].brand ?? undefined,
      imageUrl: bestImage ?? undefined,
    },
  });

  // If no image found from scrapers, fetch one from DuckDuckGo in the background
  if (!bestImage) {
    fetchProductImage(products[0].name)
      .then((url) => {
        if (url) prisma.product.update({ where: { id: product.id }, data: { imageUrl: url } }).catch(() => {});
      })
      .catch(() => {});
  }

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
      seedPriceHistory(product.id, p.source, p.price, prisma).catch(() => {});
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

  // Generate product description if missing
  if (!product.description) {
    try {
      const desc = await generateProductSummary(products[0].name, category);
      if (desc) await prisma.product.update({ where: { id: product.id }, data: { description: desc } });
    } catch { /* best-effort */ }
  }

  return NextResponse.json({ success: true, productId: product.id, aiAnalysis });
}
