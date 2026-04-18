import Link from "next/link";
import { prisma } from "@/lib/db";

export async function CategoryGrid() {
  const categories = await prisma.product.groupBy({
    by: ["category", "domain"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 9,
  });

  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-2xl font-bold mb-6">Browse by category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {categories.map(({ category, domain, _count }) => (
            <Link
              key={`${domain}-${category}`}
              href={`/search?category=${encodeURIComponent(category)}`}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3.5 hover:border-primary/40 hover:bg-muted/50 transition-colors"
            >
              <div>
                <div className="text-sm font-medium">{category}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {_count.id} products · {domain}
                </div>
              </div>
              <span className="text-muted-foreground/40 text-sm">→</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
