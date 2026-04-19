import Link from "next/link";
import { prisma } from "@/lib/db";
import { ArrowRight } from "lucide-react";

const CATEGORY_META: Record<string, { emoji: string; iconClass: string }> = {
  Smartphones: { emoji: "📱", iconClass: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400" },
  Laptops:     { emoji: "💻", iconClass: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400" },
  Headphones:  { emoji: "🎧", iconClass: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400" },
  Televisions: { emoji: "📺", iconClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400" },
  Tablets:     { emoji: "🖥️", iconClass: "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400" },
  Cameras:     { emoji: "📷", iconClass: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400" },
  Wearables:   { emoji: "⌚", iconClass: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400" },
  Electronics: { emoji: "⚡", iconClass: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-400" },
};

export async function CategoryGrid() {
  const categories = await prisma.product.groupBy({
    by: ["category"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 8,
  });

  if (!categories.length) return null;

  const [featured, ...rest] = categories;
  const featuredMeta = CATEGORY_META[featured.category] ?? { emoji: "📦", iconClass: "bg-secondary text-foreground" };

  return (
    <section className="py-24 border-t border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary mb-3">Browse</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-[-0.02em] leading-tight">
              Shop by category.
            </h2>
          </div>
          <Link
            href="/search"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Bento: 1 wide hero + grid of rest */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Hero category — full row on mobile, 1-col on lg */}
          <Link
            href={`/search?category=${encodeURIComponent(featured.category)}`}
            className="group card-lift col-span-1 lg:col-span-1 row-span-1 lg:row-span-2 flex flex-col justify-between rounded-2xl border border-border bg-card p-7 min-h-[200px] lg:min-h-0 hover:border-primary/30 transition-colors"
          >
            <div>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 ${featuredMeta.iconClass} group-hover:scale-105 transition-transform duration-200`}>
                {featuredMeta.emoji}
              </div>
              <div className="text-xl font-black tracking-tight group-hover:text-primary transition-colors mb-1">
                {featured.category}
              </div>
              <div className="text-sm text-muted-foreground">
                {featured._count.id} product{featured._count.id !== 1 ? "s" : ""} tracked
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-primary mt-6">
              Browse
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Remaining categories — 2-col sub-grid */}
          <div className="col-span-1 lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
            {rest.map(({ category, _count }) => {
              const meta = CATEGORY_META[category] ?? { emoji: "📦", iconClass: "bg-secondary text-foreground" };
              return (
                <Link
                  key={category}
                  href={`/search?category=${encodeURIComponent(category)}`}
                  className="group card-lift flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 hover:border-primary/30 transition-colors"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${meta.iconClass} group-hover:scale-105 transition-transform duration-200`}>
                    {meta.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold tracking-tight group-hover:text-primary transition-colors">
                      {category}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {_count.id} product{_count.id !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Mobile view all */}
        <div className="mt-8 sm:hidden text-center">
          <Link href="/search" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline underline-offset-4">
            View all categories
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
