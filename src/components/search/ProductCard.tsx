import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";

interface ProductCardProps {
  id: string;
  name: string;
  category: string;
  brand?: string | null;
  imageUrl?: string | null;
  bestPrice: number | null;
  sourceCount: number;
  avgRating: number;
  inStock: boolean;
}

export function ProductCard({
  id,
  name,
  category,
  brand,
  imageUrl,
  bestPrice,
  sourceCount,
  avgRating,
  inStock,
}: ProductCardProps) {
  return (
    <Link
      href={`/product/${id}`}
      className="group flex gap-3 rounded-lg border border-border bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all"
    >
      {/* Thumbnail */}
      <div className="shrink-0 w-14 h-14 rounded overflow-hidden bg-muted flex items-center justify-center">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            width={56}
            height={56}
            className="object-contain w-full h-full"
          />
        ) : (
          <span className="text-2xl">📱</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {name}
          </h3>
        </div>

        {brand && (
          <p className="text-xs text-muted-foreground mb-1 truncate">{brand}</p>
        )}

        <p className="text-xs text-muted-foreground mb-2">{category}</p>

        <div className="flex items-center justify-between">
          <div>
            {bestPrice != null ? (
              <span className="text-sm font-semibold text-foreground">
                ₹{bestPrice.toLocaleString("en-IN")}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Price unavailable</span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {avgRating > 0 && (
              <span className="flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {avgRating}
              </span>
            )}
            <span>
              {sourceCount} {sourceCount === 1 ? "platform" : "platforms"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
