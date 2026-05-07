"use client";

import { CheckCircle, XCircle, Star, Trophy, ExternalLink } from "lucide-react";

interface Listing {
  id: string;
  source: string;
  price?: number | null;
  currency: string;
  rating?: number | null;
  reviewCount?: number | null;
  inStock: boolean;
  url?: string | null;
  extraData?: Record<string, unknown> | null;
}

const SOURCE_META: Record<string, { label: string; tagline: string; logo: string; accent: string; bar: string; bg: string }> = {
  vijaysales: {
    label: "Vijay Sales",
    tagline: "India's leading electronics retail chain",
    logo: "VS",
    accent: "bg-orange-500",
    bar: "bg-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/20",
  },
  amazon: {
    label: "Amazon.in",
    tagline: "Fast delivery · Easy returns",
    logo: "A",
    accent: "bg-yellow-500",
    bar: "bg-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-950/20",
  },
  flipkart: {
    label: "Flipkart",
    tagline: "India's largest e-commerce marketplace",
    logo: "F",
    accent: "bg-blue-600",
    bar: "bg-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/20",
  },
};

interface Props {
  listings: Listing[];
  bestPrice?: number | null;
}

export function PriceComparisonTable({ listings, bestPrice: externalBest }: Props) {
  const prices = listings.flatMap((l) => (l.price != null && l.inStock ? [l.price] : []));
  const minPrice = externalBest ?? (prices.length ? Math.min(...prices) : null);
  const maxPrice = prices.length ? Math.max(...prices) : null;
  const priceRange = maxPrice != null && minPrice != null ? maxPrice - minPrice : 0;

  const sorted = [...listings].sort((a, b) => {
    if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
    if (a.price != null && b.price != null) return a.price - b.price;
    return 0;
  });

  if (!listings.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">No listings available for this product.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((listing, idx) => {
        const meta = SOURCE_META[listing.source] ?? {
          label: listing.source,
          tagline: "",
          logo: listing.source[0]?.toUpperCase() ?? "?",
          accent: "bg-muted",
          bar: "bg-muted",
          bg: "bg-muted/10",
        };

        const isBest = listing.inStock && listing.price != null && listing.price === minPrice;
        const isWorst = listing.inStock && listing.price != null && listing.price === maxPrice && minPrice !== maxPrice;
        const pctAboveBest =
          minPrice != null && listing.price != null && !isBest && listing.inStock && listing.price > minPrice
            ? Math.round(((listing.price - minPrice) / minPrice) * 100)
            : null;

        // Price bar width: cheapest = full width, others proportional
        const barPct =
          priceRange > 0 && listing.price != null && minPrice != null
            ? Math.max(10, 100 - Math.round(((listing.price - minPrice) / priceRange) * 70))
            : 100;

        return (
          <div
            key={listing.id}
            className={`relative rounded-2xl border transition-all overflow-hidden ${
              isBest
                ? "border-primary/40 bg-primary/5 dark:bg-primary/10 shadow-md shadow-primary/10"
                : !listing.inStock
                ? "border-border bg-muted/20 opacity-60"
                : "border-border bg-card hover:border-border/80 hover:shadow-sm"
            }`}
          >
            {/* Best deal ribbon */}
            {isBest && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-xl rounded-tr-2xl">
                Best Deal
              </div>
            )}

            <div className="p-5">
              <div className="flex items-start gap-4">
                {/* Platform logo */}
                <div className={`shrink-0 w-12 h-12 rounded-xl ${meta.accent} flex items-center justify-center text-white font-bold text-base shadow-sm`}>
                  {meta.logo}
                </div>

                {/* Platform info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="font-bold text-sm">{meta.label}</span>
                    {idx === 0 && listing.inStock && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        <Trophy className="h-2.5 w-2.5" /> Cheapest
                      </span>
                    )}
                    {isWorst && (
                      <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        Most expensive
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{meta.tagline}</p>
                  {listing.extraData?.mrp != null && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-through">
                      MRP ₹{Number(listing.extraData.mrp).toLocaleString("en-IN")}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div className="shrink-0 text-right">
                  {listing.price != null ? (
                    <>
                      <div className={`text-2xl font-black leading-none ${isBest ? "text-primary" : "text-foreground"}`}>
                        ₹{listing.price.toLocaleString("en-IN")}
                      </div>
                      {pctAboveBest != null && (
                        <p className="text-xs text-rose-500 dark:text-rose-400 font-medium mt-0.5">
                          +{pctAboveBest}% vs best
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">Not listed</div>
                  )}
                </div>
              </div>

              {/* Price bar */}
              {listing.inStock && listing.price != null && priceRange > 0 && (
                <div className="mt-4 mb-3">
                  <div className="h-1.5 rounded-full bg-border/60 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${meta.bar} transition-all duration-700`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Bottom row: rating + stock */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
                <div className="flex items-center gap-3">
                  {listing.rating != null ? (
                    <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {listing.rating.toFixed(1)}
                      {listing.reviewCount != null && (
                        <span className="text-muted-foreground font-normal">
                          · {listing.reviewCount.toLocaleString("en-IN")} reviews
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">No ratings yet</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {listing.inStock ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="h-3.5 w-3.5" />
                      In stock
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-rose-500">
                      <XCircle className="h-3.5 w-3.5" />
                      Out of stock
                    </span>
                  )}
                  {listing.url && listing.inStock && (
                    <a
                      href={listing.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <p className="text-xs text-muted-foreground/60 text-center pt-2">
        Prices are fetched in real-time and may vary. Always verify on the platform before purchase.
      </p>
    </div>
  );
}
