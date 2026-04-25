export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchFilters } from "@/components/search/SearchFilters";
import { MobileFilters } from "@/components/search/MobileFilters";
import { ProductCard } from "@/components/search/ProductCard";
import { LiveSearchTrigger } from "@/components/search/LiveSearchTrigger";
import { Skeleton } from "@/components/ui/skeleton";
import { prisma } from "@/lib/db";
import { Search } from "lucide-react";

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
      <div className="py-20 flex flex-col items-center gap-5 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Search className="h-9 w-9" />
        </div>
        <div>
          <p className="text-lg font-bold mb-2">What are you looking for?</p>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            Type a product name above — we'll instantly search Amazon.in, Flipkart, and Vijay Sales and compare prices for you.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center mt-2">
          {["iPhone 15", "Samsung Galaxy S24", "MacBook Air", "Sony WH-1000XM5"].map((chip) => (
            <a
              key={chip}
              href={`/search?q=${encodeURIComponent(chip)}`}
              className="text-xs font-medium px-3 py-1.5 rounded-full bg-secondary hover:bg-primary/10 hover:text-primary border border-border transition-colors"
            >
              {chip}
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2 mb-5">
        <p className="text-sm text-muted-foreground">
          <span className="font-bold text-foreground text-base">{sorted.length}</span>{" "}
          result{sorted.length !== 1 ? "s" : ""}
          {q && (
            <> for <span className="font-semibold text-foreground">"{q}"</span></>
          )}
        </p>
      </div>
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
    <div className="min-h-screen">
      {/* Subtle page header */}
      <div className="border-b border-border bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Suspense>
                <SearchBar />
              </Suspense>
            </div>
            <Suspense>
              <MobileFilters categories={categories} />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden md:block w-48 shrink-0">
            <div className="sticky top-20 rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                Filters
              </p>
              <Suspense>
                <SearchFilters categories={categories} />
              </Suspense>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            <Suspense
              fallback={
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-28 rounded-2xl" />
                  ))}
                </div>
              }
            >
              <Results searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
