export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, Star, ShoppingBag, Trophy, TrendingDown,
  BarChart3, Sparkles, Clock, Package,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PriceComparisonTable } from "@/components/product/PriceComparisonTable";
import { AIRecommendation } from "@/components/product/AIRecommendation";
import { PriceHistoryChart } from "@/components/product/PriceHistoryChart";
import { RefreshPricesButton } from "@/components/product/RefreshPricesButton";

interface Props {
  params: Promise<{ id: string }>;
}

const SOURCE_LABELS: Record<string, string> = {
  vijaysales: "Vijay Sales",
  amazon: "Amazon.in",
  flipkart: "Flipkart",
};

const SOURCE_BADGE: Record<string, string> = {
  vijaysales: "text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-950/60 border-orange-200 dark:border-orange-800",
  amazon:     "text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800",
  flipkart:   "text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800",
};

export default async function ProductPage({ params }: Props) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      listings: { orderBy: { price: "asc" } },
      analyses: { orderBy: { generatedAt: "desc" }, take: 1 },
    },
  });

  if (!product) notFound();

  const inStockListings = product.listings.filter((l) => l.inStock);
  const prices = inStockListings.flatMap((l) => (l.price != null ? [l.price] : []));
  const bestPrice = prices.length ? Math.min(...prices) : null;
  const bestListing = bestPrice != null ? inStockListings.find((l) => l.price === bestPrice) : null;

  const allPrices = product.listings.flatMap((l) => (l.price != null ? [l.price] : []));
  const maxPrice = allPrices.length ? Math.max(...allPrices) : null;
  const savings = bestPrice != null && maxPrice != null && maxPrice > bestPrice ? maxPrice - bestPrice : null;
  const savingsPct = savings && maxPrice ? Math.round((savings / maxPrice) * 100) : null;

  const ratings = product.listings.flatMap((l) => (l.rating != null ? [l.rating] : []));
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  const totalReviews = product.listings.reduce((sum, l) => sum + (l.reviewCount ?? 0), 0);

  const listingsForTable = product.listings.map((l: {
    id: string; source: string; price: number | null; currency: string;
    rating: number | null; reviewCount: number | null; inStock: boolean;
    url: string | null; extraData: unknown;
  }) => ({
    id: l.id, source: l.source, price: l.price, currency: l.currency,
    rating: l.rating, reviewCount: l.reviewCount, inStock: l.inStock,
    url: l.url, extraData: l.extraData as Record<string, unknown> | null,
  }));

  const starCount = Math.round(avgRating);

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative border-b border-border bg-gradient-to-b from-secondary/60 via-secondary/20 to-background">
        {/* subtle grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "24px 24px" }}
        />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 pt-6 pb-10">

          {/* top bar */}
          <div className="flex items-center justify-between mb-8">
            <Link
              href="/search"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Back to search
            </Link>
            <RefreshPricesButton productId={product.id} />
          </div>

          {/* product card */}
          <div className="flex flex-col sm:flex-row gap-8 items-start">

            {/* image */}
            <div className="shrink-0 self-start sm:self-center">
              <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 border border-border shadow-xl ring-1 ring-black/5 flex items-center justify-center">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-contain p-5"
                    sizes="224px"
                  />
                ) : (
                  <ShoppingBag className="h-16 w-16 text-muted-foreground/20" />
                )}
              </div>
            </div>

            {/* info */}
            <div className="flex-1 min-w-0">
              {/* tags */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {product.brand && (
                  <span className="text-[11px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                    {product.brand}
                  </span>
                )}
                <span className="text-[11px] font-medium text-muted-foreground bg-secondary border border-border px-3 py-1 rounded-full">
                  {product.category}
                </span>
                {product.listings.length > 0 && (
                  <span className="text-[11px] font-medium text-muted-foreground bg-secondary border border-border px-3 py-1 rounded-full">
                    {product.listings.length} platform{product.listings.length !== 1 ? "s" : ""} tracked
                  </span>
                )}
              </div>

              {/* name */}
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight mb-4">
                {product.name}
              </h1>

              {/* description */}
              {product.description && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-2xl">
                  {product.description}
                </p>
              )}

              {/* best price + source */}
              {bestPrice != null && (
                <div className="flex flex-wrap items-end gap-4 mb-5">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Best price</p>
                    <p className="text-4xl sm:text-5xl font-black text-primary leading-none tracking-tight">
                      ₹{bestPrice.toLocaleString("en-IN")}
                    </p>
                  </div>
                  {bestListing && (
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${SOURCE_BADGE[bestListing.source] ?? "bg-secondary text-foreground border-border"}`}>
                      <Trophy className="h-3.5 w-3.5" />
                      Best on {SOURCE_LABELS[bestListing.source] ?? bestListing.source}
                    </span>
                  )}
                </div>
              )}

              {/* savings + rating row */}
              <div className="flex flex-wrap gap-3">
                {savings != null && savingsPct != null && savings > 500 && (
                  <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold px-3.5 py-2 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <TrendingDown className="h-3.5 w-3.5" />
                    Save ₹{savings.toLocaleString("en-IN")} ({savingsPct}% off)
                  </div>
                )}
                {avgRating > 0 && (
                  <div className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-semibold px-3.5 py-2 rounded-full border border-amber-200 dark:border-amber-800">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${i < starCount ? "fill-amber-400 text-amber-400" : "text-amber-300/40"}`}
                      />
                    ))}
                    <span className="ml-0.5">{avgRating.toFixed(1)}</span>
                    {totalReviews > 0 && (
                      <span className="text-amber-600/70 dark:text-amber-400/70 font-normal">
                        ({totalReviews.toLocaleString("en-IN")} reviews)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick stats strip ─────────────────────────────────────────────── */}
      {(bestPrice != null || avgRating > 0 || product.listings.length > 0) && (
        <div className="border-b border-border bg-card">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex flex-wrap gap-6 sm:gap-10">
            {bestPrice != null && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Trophy className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Lowest price</p>
                  <p className="text-sm font-bold">₹{bestPrice.toLocaleString("en-IN")}</p>
                </div>
              </div>
            )}
            {maxPrice != null && bestPrice != null && maxPrice !== bestPrice && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Highest price</p>
                  <p className="text-sm font-bold">₹{maxPrice.toLocaleString("en-IN")}</p>
                </div>
              </div>
            )}
            {avgRating > 0 && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Star className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Avg rating</p>
                  <p className="text-sm font-bold">{avgRating.toFixed(1)} / 5</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sources</p>
                <p className="text-sm font-bold">{product.listings.length} platform{product.listings.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Last updated</p>
                <p className="text-sm font-bold">
                  {new Date(product.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <Tabs defaultValue="compare">
          <TabsList className="mb-8 h-11 p-1 rounded-xl bg-secondary border border-border w-full sm:w-auto">
            <TabsTrigger
              value="compare"
              className="flex-1 sm:flex-none text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground gap-1.5"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Compare Prices
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex-1 sm:flex-none text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground gap-1.5"
            >
              <TrendingDown className="h-3.5 w-3.5" />
              Price History
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="flex-1 sm:flex-none text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compare">
            <PriceComparisonTable listings={listingsForTable} bestPrice={bestPrice} />
          </TabsContent>

          <TabsContent value="history">
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <PriceHistoryChart productId={product.id} />
            </div>
          </TabsContent>

          <TabsContent value="ai">
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 max-w-2xl">
              <AIRecommendation
                productId={product.id}
                cachedAnalysis={product.analyses[0] ?? null}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
