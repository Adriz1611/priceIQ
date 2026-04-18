import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { prisma } from "@/lib/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PriceComparisonTable } from "@/components/product/PriceComparisonTable";
import { AIRecommendation } from "@/components/product/AIRecommendation";
import { Prisma } from "@prisma/client";

interface Props {
  params: Promise<{ id: string }>;
}

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

  const prices = product.listings.flatMap((l) => l.price != null ? [l.price] : []);
  const bestPrice = prices.length ? Math.min(...prices) : null;
  const ratings = product.listings.flatMap((l) => l.rating != null ? [l.rating] : []);
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

  const listingsForTable = product.listings.map((l) => ({
    id: l.id,
    source: l.source,
    price: l.price,
    currency: l.currency,
    rating: l.rating,
    reviewCount: l.reviewCount,
    inStock: l.inStock,
    url: l.url,
    extraData: l.extraData as Prisma.JsonObject | null,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <Link
        href="/search"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to search
      </Link>

      {/* Product header */}
      <div className="flex gap-6 mb-10">
        {product.imageUrl && (
          <div className="shrink-0 w-20 h-20 rounded-md overflow-hidden border border-border bg-muted">
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={80}
              height={80}
              className="object-contain w-full h-full"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground mb-1">
            {product.brand ? `${product.brand} · ` : ""}{product.category}
          </p>
          <h1 className="text-2xl font-bold leading-tight mb-3">{product.name}</h1>

          <div className="flex items-center gap-6">
            {bestPrice != null ? (
              <div>
                <span className="text-xs text-muted-foreground block">Best price</span>
                <span className="text-2xl font-bold text-primary">
                  ₹{bestPrice.toLocaleString("en-IN")}
                </span>
              </div>
            ) : null}
            {avgRating > 0 && (
              <div>
                <span className="text-xs text-muted-foreground block">Avg rating</span>
                <span className="flex items-center gap-1 text-sm font-semibold">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {avgRating.toFixed(1)}
                </span>
              </div>
            )}
            <div>
              <span className="text-xs text-muted-foreground block">Platforms</span>
              <span className="text-sm font-semibold">{product.listings.length}</span>
            </div>
          </div>
        </div>
      </div>

      {product.description && (
        <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-2xl">
          {product.description}
        </p>
      )}

      {/* Tabs */}
      <Tabs defaultValue="compare">
        <TabsList className="mb-6 h-9">
          <TabsTrigger value="compare" className="text-sm">Price Comparison</TabsTrigger>
          <TabsTrigger value="ai" className="text-sm">AI Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="compare">
          <PriceComparisonTable listings={listingsForTable} />
        </TabsContent>

        <TabsContent value="ai">
          <div className="rounded-lg border border-border p-6 bg-card max-w-2xl">
            <h2 className="text-sm font-semibold mb-4">AI Analysis</h2>
            <AIRecommendation
              productId={product.id}
              cachedAnalysis={product.analyses[0] ?? null}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
