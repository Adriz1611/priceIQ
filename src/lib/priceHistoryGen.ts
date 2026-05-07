import { PrismaClient } from "@prisma/client";

function getPriceSlab(price: number): number {
  if (price < 1000) return 100;
  if (price < 10000) return 500;
  if (price < 50000) return 1000;
  if (price < 100000) return 2000;
  return 5000;
}

export async function seedPriceHistory(
  productId: string,
  source: string,
  basePrice: number,
  prisma: PrismaClient
): Promise<void> {
  const existing = await prisma.priceHistory.findFirst({
    where: { productId, source },
  });

  if (existing) return;

  const slab = getPriceSlab(basePrice);
  const cap = basePrice * 0.25;
  const entries: { productId: string; source: string; price: number; recordedAt: Date }[] = [];
  let current = basePrice;

  for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
    const date = new Date();
    date.setDate(date.getDate() - dayOffset);

    const moves = [-slab, 0, 0, slab];
    const delta = moves[Math.floor(Math.random() * moves.length)];
    current += delta;
    current = Math.max(basePrice - cap, Math.min(basePrice + cap, current));
    current = Math.round(current / 100) * 100;

    entries.push({ productId, source, price: current, recordedAt: new Date(date) });
  }

  await prisma.priceHistory.createMany({ data: entries });
}
