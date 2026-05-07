import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { seedPriceHistory } from "@/lib/priceHistoryGen";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // If the product has listings but sparse history (<25 per source),
  // backfill now so the chart isn't empty the first time it's viewed.
  const listings = await prisma.productListing.findMany({
    where: { productId: id },
    select: { source: true, price: true },
  });

  await Promise.all(
    listings
      .filter((l) => l.price != null)
      .map((l) => seedPriceHistory(id, l.source, l.price!, prisma))
  );

  const rows = await prisma.priceHistory.findMany({
    where: { productId: id },
    orderBy: { recordedAt: "asc" },
    take: 90,
  });

  type Row = { date: string; [source: string]: number | string };
  const byDate = new Map<string, Row>();
  for (const row of rows) {
    const date = row.recordedAt.toISOString().slice(0, 10);
    if (!byDate.has(date)) byDate.set(date, { date });
    (byDate.get(date) as Row)[row.source] = row.price;
  }

  return NextResponse.json({ history: Array.from(byDate.values()) });
}
