import { CheckCircle, ExternalLink, XCircle, Star, Trophy } from "lucide-react";

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

const SOURCE_META: Record<string, { label: string; description: string; logo: string }> = {
  vijaysales: {
    label: "Vijay Sales",
    description: "India's leading electronics retail chain",
    logo: "VS",
  },
  amazon: {
    label: "Amazon.in",
    description: "Fast delivery with Prime, easy returns",
    logo: "A",
  },
  flipkart: {
    label: "Flipkart",
    description: "India's largest e-commerce marketplace",
    logo: "F",
  },
};

const SOURCE_COLORS: Record<string, string> = {
  vijaysales: "bg-orange-500",
  amazon: "bg-yellow-500",
  flipkart: "bg-blue-600",
};

interface PriceComparisonTableProps {
  listings: Listing[];
}

export function PriceComparisonTable({ listings }: PriceComparisonTableProps) {
  const prices = listings.flatMap((l) => (l.price != null && l.inStock ? [l.price] : []));
  const minPrice = prices.length ? Math.min(...prices) : null;

  // Sort: in-stock first, then by price
  const sorted = [...listings].sort((a, b) => {
    if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
    if (a.price != null && b.price != null) return a.price - b.price;
    return 0;
  });

  return (
    <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
      {sorted.map((listing) => {
        const meta = SOURCE_META[listing.source] ?? {
          label: listing.source,
          description: "",
          logo: listing.source[0].toUpperCase(),
        };
        const isBest = listing.price != null && listing.price === minPrice && listing.inStock;
        const colorClass = SOURCE_COLORS[listing.source] ?? "bg-muted";
        const pctMore =
          minPrice != null && listing.price != null && !isBest && listing.price > minPrice
            ? Math.round(((listing.price - minPrice) / minPrice) * 100)
            : null;

        return (
          <div
            key={listing.id}
            className={`p-4 sm:p-5 transition-colors ${
              isBest
                ? "bg-primary/5 dark:bg-primary/10"
                : !listing.inStock
                ? "bg-muted/30 opacity-60"
                : "bg-card"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* Logo */}
                <div
                  className={`shrink-0 w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center text-white font-bold text-sm shadow-sm`}
                >
                  {meta.logo}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-0.5">
                    <span className="text-sm font-semibold">{meta.label}</span>
                    {isBest && (
                      <span className="inline-flex items-center gap-1 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-semibold">
                        <Trophy className="h-3 w-3" /> Best Deal
                      </span>
                    )}
                    {pctMore != null && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {pctMore}% more expensive
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{meta.description}</p>
                  {listing.extraData?.mrp != null && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      MRP: ₹{Number(listing.extraData.mrp).toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
              </div>

              <div className="shrink-0 text-right">
                {listing.price != null ? (
                  <div className={`text-xl font-bold ${isBest ? "text-primary" : ""}`}>
                    ₹{listing.price.toLocaleString("en-IN")}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Not listed</div>
                )}

                <div className="flex items-center justify-end gap-3 mt-1.5">
                  {listing.rating != null && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {listing.rating.toFixed(1)}
                      {listing.reviewCount != null && (
                        <span className="hidden sm:inline">({listing.reviewCount.toLocaleString("en-IN")})</span>
                      )}
                    </span>
                  )}

                  {listing.inStock ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle className="h-3 w-3" /> In stock
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-rose-500">
                      <XCircle className="h-3 w-3" /> Out of stock
                    </span>
                  )}

                  {listing.url && listing.inStock && (
                    <a
                      href={listing.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      Buy <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
