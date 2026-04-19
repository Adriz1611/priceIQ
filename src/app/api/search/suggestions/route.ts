import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      category: true,
      brand: true,
      imageUrl: true,
      listings: { select: { price: true }, orderBy: { price: "asc" }, take: 1 },
    },
    take: 6,
  });

  return NextResponse.json(
    products.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      brand: p.brand,
      imageUrl: p.imageUrl,
      bestPrice: p.listings[0]?.price ?? null,
    }))
  );
}
