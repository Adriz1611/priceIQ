import Groq from "groq-sdk";

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface ListingInput {
  source: string;
  price?: number | null;
  currency: string;
  rating?: number | null;
  reviewCount?: number | null;
  inStock: boolean;
  extraData?: Record<string, unknown> | null;
}

const SOURCE_LABELS: Record<string, string> = {
  vijaysales: "Vijay Sales",
  amazon: "Amazon.in",
  flipkart: "Flipkart",
};

export async function analyzeProduct(
  productName: string,
  category: string,
  domain: string,
  listings: ListingInput[]
): Promise<{
  summary: string;
  recommendation: string;
  bestSource: string;
  confidenceNote: string | null;
}> {
  const listingText = listings
    .map((l) => {
      const label = SOURCE_LABELS[l.source] ?? l.source;
      const price = l.price != null ? `₹${l.price.toLocaleString("en-IN")}` : "Price not listed";
      const rating = l.rating != null ? `${l.rating}/5 (${l.reviewCount ?? 0} reviews)` : "No rating";
      const extras: string[] = [];
      if (l.extraData) {
        if (l.extraData.mrp) extras.push(`MRP: ₹${Number(l.extraData.mrp).toLocaleString("en-IN")}`);
      }
      return `- ${label}: Price=${price}, Rating=${rating}, In stock=${l.inStock}${extras.length ? ", " + extras.join(", ") : ""}`;
    })
    .join("\n");

  const prompt = `You are a product comparison analyst for Indian consumers. Analyze these listings from Indian e-commerce platforms and respond ONLY with valid JSON.

Product: ${productName}
Category: ${category}

Listings from Indian e-commerce platforms:
${listingText}

Consider: price difference in INR, seller trust, delivery speed (Amazon/Flipkart faster), warranty, and overall value for Indian buyers.

Respond with exactly this JSON:
{
  "summary": "2-3 sentence factual summary comparing prices and ratings across platforms",
  "recommendation": "Clear recommendation for Indian buyers — which platform offers the best deal and why",
  "bestSource": "the source key with best overall value (one of: ${listings.map((l) => l.source).join(", ")})",
  "confidenceNote": "any important caveat about prices or availability, or null if data is clear"
}`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 450,
    temperature: 0.2,
  });

  const content = response.choices[0].message.content ?? "{}";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in AI response");

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    summary: parsed.summary ?? "Analysis unavailable.",
    recommendation: parsed.recommendation ?? "Check the listings above.",
    bestSource: parsed.bestSource ?? listings[0]?.source ?? "unknown",
    confidenceNote: parsed.confidenceNote ?? null,
  };
}
