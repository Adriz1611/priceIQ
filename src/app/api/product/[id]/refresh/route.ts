import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { liveSearch } from "@/lib/scrapers/live";
import { seedPriceHistory } from "@/lib/priceHistoryGen";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ success: false }, { status: 404 });

  let products: Awaited<ReturnType<typeof liveSearch>>["products"];
  try {
    ({ products } = await liveSearch(product.name));
  } catch (err) {
    console.error("refresh liveSearch error:", err);
    return NextResponse.json({ success: false, error: "Search failed" }, { status: 502 });
  }
  if (!products.length) {
    return NextResponse.json({ success: false, error: "No results from any platform" });
  }

  for (const p of products) {
    await prisma.productListing.upsert({
      where: { productId_source: { productId: id, source: p.source } },
      create: {
        productId: id,
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
        data: { productId: id, source: p.source, price: p.price },
      });
      seedPriceHistory(id, p.source, p.price, prisma).catch(() => {});
    }
  }

  return NextResponse.json({ success: true, updated: products.length });
}
