import { prisma } from "@/lib/db";

export async function StatsBar() {
  const [products, listings, searches] = await Promise.all([
    prisma.product.count(),
    prisma.productListing.count(),
    prisma.searchLog.count(),
  ]);

  const stats = [
    { label: "Products tracked", value: products.toLocaleString("en-IN") },
    { label: "Platforms compared", value: "3" },
    { label: "Price data points", value: listings.toLocaleString("en-IN") },
    { label: "Total searches", value: searches.toLocaleString("en-IN") },
  ];

  return (
    <div className="border-b border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {stats.map(({ label, value }) => (
            <div key={label} className="py-5 px-4 text-center md:border-r border-border last:border-0">
              <div className="text-2xl font-bold tabular-nums">{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
