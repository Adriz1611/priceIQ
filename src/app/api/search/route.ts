import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const category = searchParams.get("category") ?? "";
  const source = searchParams.get("source") ?? "";
  const domain = searchParams.get("domain") ?? "";
  const sort = searchParams.get("sort") ?? "relevance";

  const products = await prisma.product.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { brand: { contains: q, mode: "insensitive" } },
              { category: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(category ? { category: { equals: category, mode: "insensitive" } } : {}),
      ...(domain ? { domain } : {}),
      listings: { some: source ? { source } : {} },
    },
    include: { listings: { select: { price: true, source: true, rating: true, inStock: true } } },
    take: 60,
  });

  const results = products.map((product) => {
    const prices = product.listings.map((l) => l.price).filter((p): p is number => p != null);
    const bestPrice = prices.length ? Math.min(...prices) : null;
    const bestListing = bestPrice != null
      ? product.listings.find((l) => l.price === bestPrice)
      : product.listings[0];
    const ratings = product.listings.flatMap((l) => (l.rating != null ? [l.rating] : []));
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      category: product.category,
      domain: product.domain,
      brand: product.brand,
      imageUrl: product.imageUrl,
      bestPrice,
      sourceCount: product.listings.length,
      avgRating: Math.round(avgRating * 10) / 10,
      bestSource: bestListing?.source,
      inStock: product.listings.some((l) => l.inStock),
    };
  });

  const sorted = [...results].sort((a, b) => {
    if (sort === "price_asc") {
      if (a.bestPrice == null) return 1;
      if (b.bestPrice == null) return -1;
      return a.bestPrice - b.bestPrice;
    }
    if (sort === "price_desc") {
      if (a.bestPrice == null) return 1;
      if (b.bestPrice == null) return -1;
      return b.bestPrice - a.bestPrice;
    }
    if (sort === "rating") return b.avgRating - a.avgRating;
    return b.sourceCount - a.sourceCount;
  });

  if (q) {
    await prisma.searchLog.create({ data: { query: q, resultsCount: sorted.length } });
  }

  return NextResponse.json({ success: true, data: sorted, total: sorted.length });
}
