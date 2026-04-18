import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      listings: {
        orderBy: { price: "asc" },
      },
      analyses: {
        orderBy: { generatedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!product) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: product });
}
