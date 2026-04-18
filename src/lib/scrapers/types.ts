export type SourceName = "vijaysales" | "amazon" | "flipkart";

export interface NormalizedProduct {
  name: string;
  slug: string;
  category: string;
  domain: "electronics";
  brand?: string;
  description?: string;
  imageUrl?: string;
  source: SourceName;
  sourceId: string;
  price?: number;
  currency: "INR";
  rating?: number;
  reviewCount?: number;
  url?: string;
  inStock: boolean;
  extraData?: Record<string, unknown>;
}
