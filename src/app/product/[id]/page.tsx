export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Star, ShoppingBag, Trophy, TrendingDown } from "lucide-react";
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

const SOURCE_COLORS: Record<string, string> = {
  vijaysales: "text-orange-900 bg-orange-100 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300 dark:border-orange-700",
  amazon: "text-amber-900 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700",
  flipkart: "text-blue-900 bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-700",
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
    id: string;
    source: string;
    price: number | null;
    currency: string;
    rating: number | null;
    reviewCount: number | null;
    inStock: boolean;
    url: string | null;
    extraData: unknown;
  }) => ({
    id: l.id,
    source: l.source,
    price: l.price,
    currency: l.currency,
    rating: l.rating,
    reviewCount: l.reviewCount,
    inStock: l.inStock,
    url: l.url,
    extraData: l.extraData as Record<string, unknown> | null,
  }));

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border bg-secondary/30">

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
          {/* Top nav */}
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

          {/* Product info */}
          <div className="flex flex-col sm:flex-row gap-8">
            {/* Image */}
            <div className="shrink-0 self-start">
              <div className="w-40 h-40 sm:w-52 sm:h-52 rounded-2xl overflow-hidden bg-white dark:bg-secondary border border-border shadow-lg flex items-center justify-center">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    width={208}
                    height={208}
                    className="object-contain w-full h-full p-3"
                  />
                ) : (
                  <ShoppingBag className="h-16 w-16 text-muted-foreground/20" />
                )}
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {product.brand && (
                  <span className="text-xs font-bold uppercase tracking-wider text-primary/80 bg-primary/8 px-2.5 py-1 rounded-full">
                    {product.brand}
                  </span>
                )}
                <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                  {product.category}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-5 tracking-tight">
                {product.name}
              </h1>

              {/* Stats */}
              <div className="flex flex-wrap gap-6 mb-5">
                {bestPrice != null && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Best price</p>
                    <p className="text-4xl font-black text-primary leading-none tracking-tight">
                      ₹{bestPrice.toLocaleString("en-IN")}
                    </p>
                    {bestListing && (
                      <p className={`inline-flex items-center gap-1 text-xs font-medium mt-1.5 px-2 py-0.5 rounded-full border ${SOURCE_COLORS[bestListing.source] ?? "text-muted-foreground"}`}>
                        <Trophy className="h-3 w-3" />
                        on {SOURCE_LABELS[bestListing.source] ?? bestListing.source}
                      </p>
                    )}
                  </div>
                )}

                {avgRating > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Avg rating</p>
                    <p className="flex items-center gap-1.5 text-2xl font-bold leading-none">
                      <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                      {avgRating.toFixed(1)}
                    </p>
                    {totalReviews > 0 && (
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {totalReviews.toLocaleString("en-IN")} reviews
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Platforms</p>
                  <p className="text-2xl font-bold leading-none">{product.listings.length}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">compared</p>
                </div>
              </div>

              {/* Savings banner */}
              {savings != null && savingsPct != null && savings > 500 && bestListing && (
                <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 text-sm font-semibold px-4 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700">
                  <TrendingDown className="h-4 w-4" />
                  Save ₹{savings.toLocaleString("en-IN")} ({savingsPct}% off) vs highest price
                </div>
              )}

              {/* AI Description */}
              {product.description && (
                <p className="text-sm text-muted-foreground leading-relaxed mt-4 max-w-xl">
                  {product.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <Tabs defaultValue="compare">
          <TabsList className="mb-8 h-10 p-1 rounded-xl bg-secondary">
            <TabsTrigger value="compare" className="text-sm rounded-lg data-[state=active]:shadow-sm">
              Price Comparison
            </TabsTrigger>
            <TabsTrigger value="history" className="text-sm rounded-lg data-[state=active]:shadow-sm">
              Price History
            </TabsTrigger>
            <TabsTrigger value="ai" className="text-sm rounded-lg data-[state=active]:shadow-sm">
              AI Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compare">
            <PriceComparisonTable listings={listingsForTable} />
          </TabsContent>

          <TabsContent value="history">
            <div className="rounded-2xl border border-border p-6 sm:p-8 bg-card">
              <PriceHistoryChart productId={product.id} />
            </div>
          </TabsContent>

          <TabsContent value="ai">
            <div className="rounded-2xl border border-border p-6 sm:p-8 bg-card max-w-2xl">
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
