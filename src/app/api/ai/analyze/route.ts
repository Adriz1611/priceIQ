import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { analyzeProduct } from "@/lib/ai/groq";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  const { productId } = await req.json();
  if (!productId) {
    return NextResponse.json({ success: false, error: "productId required" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      listings: true,
      analyses: { orderBy: { generatedAt: "desc" }, take: 1 },
    },
  });

  if (!product) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const latest = product.analyses[0];
  if (latest) {
    const age = Date.now() - new Date(latest.generatedAt).getTime();
    if (age < 24 * 60 * 60 * 1000) {
      return NextResponse.json({ success: true, data: latest, cached: true });
    }
  }

  if (!product.listings.length) {
    return NextResponse.json({ success: false, error: "No listings" }, { status: 400 });
  }

  const result = await analyzeProduct(
    product.name,
    product.category,
    product.domain,
    product.listings.map((l) => ({
      source: l.source,
      price: l.price,
      currency: l.currency,
      rating: l.rating,
      reviewCount: l.reviewCount,
      inStock: l.inStock,
      extraData: l.extraData as Prisma.JsonObject | null,
    }))
  );

  const analysis = await prisma.aIAnalysis.create({
    data: {
      productId: product.id,
      summary: result.summary,
      recommendation: result.recommendation,
      bestSource: result.bestSource,
      confidenceNote: result.confidenceNote,
    },
  });

  return NextResponse.json({ success: true, data: analysis, cached: false });
}
