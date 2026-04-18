import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const history = await prisma.priceHistory.findMany({
    where: { productId: id },
    orderBy: { recordedAt: "asc" },
  });

  // Group by source
  const grouped: Record<string, { date: string; price: number }[]> = {};
  for (const entry of history) {
    if (!grouped[entry.source]) grouped[entry.source] = [];
    grouped[entry.source].push({
      date: entry.recordedAt.toISOString().split("T")[0],
      price: entry.price,
    });
  }

  return NextResponse.json({ success: true, data: grouped });
}
