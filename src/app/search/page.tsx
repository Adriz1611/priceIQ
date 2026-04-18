import { Suspense } from "react";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchFilters } from "@/components/search/SearchFilters";
import { ProductCard } from "@/components/search/ProductCard";
import { LiveSearchTrigger } from "@/components/search/LiveSearchTrigger";
import { Skeleton } from "@/components/ui/skeleton";
import { prisma } from "@/lib/db";

interface Props {
  searchParams: Promise<{ q?: string; category?: string; source?: string; sort?: string }>;
}

async function Results({ searchParams }: Props) {
  const p = await searchParams;
  const q = p.q?.trim() ?? "";
  const category = p.category ?? "";
  const source = p.source ?? "";
  const sort = p.sort ?? "";

  const products = await prisma.product.findMany({
    where: {
      ...(q ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { brand: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      } : {}),
      ...(category ? { category: { equals: category, mode: "insensitive" } } : {}),
      ...(source ? { listings: { some: { source } } } : {}),
    },
    include: { listings: { select: { price: true, source: true, rating: true, inStock: true } } },
    take: 60,
  });

  if (q) {
    await prisma.searchLog.create({ data: { query: q, resultsCount: products.length } });
  }

  const results = products.map((product) => {
    const prices = product.listings.flatMap((l) => l.price != null ? [l.price] : []);
    const bestPrice = prices.length ? Math.min(...prices) : null;
    const ratings = product.listings.flatMap((l) => l.rating != null ? [l.rating] : []);
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    return {
      id: product.id,
      name: product.name,
      category: product.category,
      domain: product.domain,
      imageUrl: product.imageUrl,
      brand: product.brand,
      bestPrice,
      sourceCount: product.listings.length,
      avgRating: Math.round(avgRating * 10) / 10,
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

  if (!sorted.length) {
    if (q) return <LiveSearchTrigger query={q} />;
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Enter a product name to search.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        {sorted.length} result{sorted.length !== 1 ? "s" : ""}
        {q && <> for <strong className="text-foreground">"{q}"</strong></>}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sorted.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>
    </div>
  );
}

async function getCategories() {
  const cats = await prisma.product.findMany({
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  return cats.map((c) => c.category);
}

export default async function SearchPage({ searchParams }: Props) {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="hidden md:block w-44 shrink-0 pt-10">
          <Suspense>
            <SearchFilters categories={categories} />
          </Suspense>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          <div className="mb-6">
            <Suspense>
              <SearchBar />
            </Suspense>
          </div>
          <Suspense
            fallback={
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-lg" />
                ))}
              </div>
            }
          >
            <Results searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
