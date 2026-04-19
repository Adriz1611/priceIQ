import { prisma } from "@/lib/db";

export async function StatsBar() {
  const [products, listings, searches] = await Promise.all([
    prisma.product.count(),
    prisma.productListing.count(),
    prisma.searchLog.count(),
  ]);

  const stats = [
    { value: products.toLocaleString("en-IN"), label: "Products tracked" },
    { value: "3", label: "Live platforms" },
    { value: listings.toLocaleString("en-IN"), label: "Price data points" },
    { value: searches.toLocaleString("en-IN"), label: "Searches run" },
  ];

  return (
    <div className="border-y border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {stats.map(({ value, label }, i) => (
            <div
              key={label}
              className={`py-8 px-6 text-center ${
                i < stats.length - 1 ? "md:border-r border-border" : ""
              } ${i === 1 ? "border-r border-border md:border-r" : ""}`}
            >
              <div className="text-4xl font-black tabular-nums tracking-tight text-foreground mb-1">
                {value}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
