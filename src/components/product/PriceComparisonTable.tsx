import { CheckCircle, ExternalLink, XCircle, Star } from "lucide-react";

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

function ExtraDataRow({ extraData }: { extraData: Record<string, unknown> }) {
  const interesting: Record<string, string> = {};
  if (extraData.mrp) interesting["MRP"] = `₹${Number(extraData.mrp).toLocaleString("en-IN")}`;

  if (!Object.keys(interesting).length) return null;

  return (
    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
      {Object.entries(interesting).map(([k, v]) => (
        <span key={k} className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{k}:</span> {v}
        </span>
      ))}
    </div>
  );
}

interface PriceComparisonTableProps {
  listings: Listing[];
}

export function PriceComparisonTable({ listings }: PriceComparisonTableProps) {
  const prices = listings.flatMap((l) => (l.price != null ? [l.price] : []));
  const minPrice = prices.length ? Math.min(...prices) : null;

  return (
    <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
      {listings.map((listing) => {
        const meta = SOURCE_META[listing.source] ?? {
          label: listing.source,
          description: "",
          logo: listing.source[0].toUpperCase(),
        };
        const isBest = listing.price != null && listing.price === minPrice;
        const colorClass = SOURCE_COLORS[listing.source] ?? "bg-muted";

        return (
          <div
            key={listing.id}
            className={`p-4 ${isBest ? "bg-primary/5" : "bg-card"}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* Source logo */}
                <div
                  className={`shrink-0 w-9 h-9 rounded-lg ${colorClass} flex items-center justify-center text-white font-bold text-sm`}
                >
                  {meta.logo}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium">{meta.label}</span>
                    {isBest && (
                      <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-medium">
                        Best price
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{meta.description}</p>
                  {listing.extraData && (
                    <ExtraDataRow extraData={listing.extraData as Record<string, unknown>} />
                  )}
                </div>
              </div>

              <div className="shrink-0 text-right">
                {listing.price != null ? (
                  <div className={`text-lg font-bold ${isBest ? "text-primary" : ""}`}>
                    ₹{listing.price.toLocaleString("en-IN")}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Not listed</div>
                )}

                <div className="flex items-center justify-end gap-3 mt-1">
                  {listing.rating != null && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {listing.rating.toFixed(1)}
                      {listing.reviewCount != null && (
                        <span>({listing.reviewCount.toLocaleString("en-IN")})</span>
                      )}
                    </span>
                  )}

                  {listing.inStock ? (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle className="h-3 w-3" /> In stock
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <XCircle className="h-3 w-3" /> Unavailable
                    </span>
                  )}

                  {listing.url && (
                    <a
                      href={listing.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
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
