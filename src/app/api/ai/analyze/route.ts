import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { analyzeProduct, generateProductSummary } from "@/lib/ai/groq";

export async function POST(req: NextRequest) {
  let productId: string;
  try {
    const body = await req.json() as { productId?: string };
    productId = body?.productId ?? "";
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

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
    product.listings.map((l: {
      source: string;
      price: number | null;
      currency: string;
      rating: number | null;
      reviewCount: number | null;
      inStock: boolean;
      extraData: unknown;
    }) => ({
      source: l.source,
      price: l.price,
      currency: l.currency,
      rating: l.rating,
      reviewCount: l.reviewCount,
      inStock: l.inStock,
      extraData: l.extraData as Record<string, unknown> | null,
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

  // Generate product description if missing
  if (!product.description) {
    try {
      const summary = await generateProductSummary(product.name, product.category);
      if (summary) {
        await prisma.product.update({ where: { id: product.id }, data: { description: summary } });
      }
    } catch { /* best-effort */ }
  }

  return NextResponse.json({ success: true, data: analysis, cached: false });
}
