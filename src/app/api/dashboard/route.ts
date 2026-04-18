import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalProducts,
    totalListings,
    searchesToday,
    recentSearches,
    categoryStats,
    sourceStats,
    domainStats,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.productListing.count(),
    prisma.searchLog.count({ where: { searchedAt: { gte: today } } }),
    prisma.searchLog.findMany({
      orderBy: { searchedAt: "desc" },
      take: 20,
      select: { query: true, resultsCount: true, searchedAt: true },
    }),
    prisma.product.groupBy({
      by: ["category"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.productListing.groupBy({
      by: ["source"],
      _count: { id: true },
      _avg: { price: true },
    }),
    prisma.product.groupBy({
      by: ["domain"],
      _count: { id: true },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      totalProducts,
      totalListings,
      totalSources: sourceStats.length,
      searchesToday,
      recentSearches,
      categoryStats: categoryStats.map((c) => ({
        category: c.category,
        count: c._count.id,
      })),
      sourceStats: sourceStats.map((s) => ({
        source: s.source,
        count: s._count.id,
        avgPrice: s._avg.price != null ? Math.round(s._avg.price * 100) / 100 : null,
      })),
      domainStats: domainStats.map((d) => ({
        domain: d.domain,
        count: d._count.id,
      })),
    },
  });
}
