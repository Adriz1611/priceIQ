import { prisma } from "@/lib/db";
import { KPICard } from "@/components/dashboard/KPICard";
import { CategoryBarChart } from "@/components/dashboard/CategoryBarChart";
import { SourcePieChart } from "@/components/dashboard/SourcePieChart";
import { RecentSearches } from "@/components/dashboard/RecentSearches";

export const revalidate = 60;

const SOURCE_LABELS: Record<string, string> = {
  vijaysales: "Vijay Sales",
  amazon: "Amazon.in",
  flipkart: "Flipkart",
};

export default async function DashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalProducts,
    totalListings,
    searchesToday,
    totalSearches,
    recentSearches,
    categoryStats,
    sourceStats,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.productListing.count(),
    prisma.searchLog.count({ where: { searchedAt: { gte: today } } }),
    prisma.searchLog.count(),
    prisma.searchLog.findMany({ orderBy: { searchedAt: "desc" }, take: 15 }),
    prisma.product.groupBy({
      by: ["category"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.productListing.groupBy({
      by: ["source"],
      _count: { id: true },
      _avg: { price: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Price data aggregated from Amazon.in, Flipkart, and Vijay Sales
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard label="Total products" value={totalProducts} sub="Electronics tracked" />
        <KPICard label="Platforms" value={sourceStats.length} sub="Active sources" />
        <KPICard label="Total listings" value={totalListings} sub="Price data points" />
        <KPICard label="Searches today" value={searchesToday} sub={`${totalSearches} total`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Products by category</h2>
          <CategoryBarChart
            data={categoryStats.map((c) => ({ category: c.category, count: c._count.id }))}
          />
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Platform distribution</h2>
          <SourcePieChart
            data={sourceStats.map((s) => ({
              source: s.source,
              count: s._count.id,
              avgPrice: s._avg.price != null ? Math.round(s._avg.price) : null,
            }))}
          />
        </div>
      </div>

      {/* Source details + Recent searches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Platform details</h2>
          <div className="divide-y divide-border">
            {sourceStats.map((s) => (
              <div key={s.source} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{SOURCE_LABELS[s.source] ?? s.source}</p>
                  <p className="text-xs text-muted-foreground">{s._count.id} listings</p>
                </div>
                <div className="text-right">
                  {s._avg.price != null ? (
                    <>
                      <p className="text-sm font-semibold">
                        ₹{Math.round(s._avg.price).toLocaleString("en-IN")}
                      </p>
                      <p className="text-xs text-muted-foreground">avg price</p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">No price data</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Recent searches</h2>
          <RecentSearches searches={recentSearches} />
        </div>
      </div>
    </div>
  );
}
