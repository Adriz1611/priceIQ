import { scrapeVijaySales } from "./vijaysales";
import { scrapeAmazon } from "./amazon";
import { scrapeFlipkart } from "./flipkart";
import type { NormalizedProduct } from "./types";

export async function runAllScrapers(): Promise<NormalizedProduct[]> {
  const allProducts: NormalizedProduct[] = [];

  console.log("Fetching from Vijay Sales...");
  const vsProducts = await scrapeVijaySales();
  console.log(`✓ Vijay Sales: ${vsProducts.length} products`);
  allProducts.push(...vsProducts);

  console.log("Fetching from Amazon.in...");
  const amzProducts = await scrapeAmazon();
  console.log(`✓ Amazon.in: ${amzProducts.length} products`);
  allProducts.push(...amzProducts);

  console.log("Fetching from Flipkart...");
  const fkProducts = await scrapeFlipkart();
  console.log(`✓ Flipkart: ${fkProducts.length} products`);
  allProducts.push(...fkProducts);

  return allProducts;
}

export type { NormalizedProduct };
