import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const rows = await prisma.priceHistory.findMany({
    where: { productId: id },
    orderBy: { recordedAt: "asc" },
    take: 90,
  });

  // Merge into { date, vijaysales?, amazon?, flipkart? }[]
  type Row = { date: string; [source: string]: number | string };
  const byDate = new Map<string, Row>();
  for (const row of rows) {
    const date = row.recordedAt.toISOString().slice(0, 10);
    if (!byDate.has(date)) byDate.set(date, { date });
    (byDate.get(date) as Row)[row.source] = row.price;
  }

  return NextResponse.json({ history: Array.from(byDate.values()) });
}
