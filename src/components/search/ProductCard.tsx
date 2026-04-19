import Link from "next/link";
import Image from "next/image";
import { Star, ShoppingBag, ArrowRight } from "lucide-react";

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

const SOURCE_DOTS = [
  "bg-amber-400",
  "bg-blue-500",
  "bg-orange-500",
];

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
      className="group card-lift relative flex gap-4 rounded-2xl border border-border bg-card p-4 hover:border-primary/30 overflow-hidden"
    >
      {/* Image */}
      <div className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-muted flex items-center justify-center border border-border/50">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            width={80}
            height={80}
            className="object-contain w-full h-full p-1.5 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
        )}
        {!inStock && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">OOS</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          {/* Brand + category */}
          <div className="flex items-center gap-1.5 mb-1">
            {brand && <span className="text-[10px] font-semibold text-primary/70 uppercase tracking-wider">{brand}</span>}
            {brand && <span className="text-muted-foreground/40 text-[10px]">·</span>}
            <span className="text-[10px] text-muted-foreground">{category}</span>
          </div>
          {/* Name */}
          <h3 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-200">
            {name}
          </h3>
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between mt-2.5">
          <div>
            {bestPrice != null ? (
              <span className="text-base font-bold text-foreground">
                ₹{bestPrice.toLocaleString("en-IN")}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Price unavailable</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {avgRating > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="font-medium text-foreground">{avgRating}</span>
              </span>
            )}
            {/* Platform dots */}
            <div className="flex items-center gap-1">
              {Array.from({ length: sourceCount }).map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${SOURCE_DOTS[i] ?? "bg-muted"}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Arrow */}
      <ArrowRight className="shrink-0 self-center h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
    </Link>
  );
}
