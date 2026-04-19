import { prisma } from "@/lib/db";
import { KPICard } from "@/components/dashboard/KPICard";
import { CategoryBarChart } from "@/components/dashboard/CategoryBarChart";
import { SourcePieChart } from "@/components/dashboard/SourcePieChart";
import { RecentSearches } from "@/components/dashboard/RecentSearches";
import { ReScrapeButton } from "@/components/dashboard/ReScrapeButton";
import { Package, Store, BarChart3, Search, TrendingUp, Globe } from "lucide-react";

export const revalidate = 60;

const SOURCE_LABELS: Record<string, string> = {
  vijaysales: "Vijay Sales",
  amazon: "Amazon.in",
  flipkart: "Flipkart",
};

const SOURCE_COLORS: Record<string, string> = {
  vijaysales: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800",
  amazon: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800",
  flipkart: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800",
};

const SOURCE_DOT: Record<string, string> = {
  vijaysales: "bg-orange-500",
  amazon: "bg-amber-500",
  flipkart: "bg-blue-500",
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
    <div className="min-h-screen">
      {/* Page hero */}
      <div className="border-b border-border bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
                <BarChart3 className="h-3 w-3" />
                Live analytics
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight leading-none mb-2">
                Platform <span className="text-primary">Insights</span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Price data aggregated from Amazon.in, Flipkart &amp; Vijay Sales in real-time
              </p>
            </div>
            <ReScrapeButton />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard
            label="Products tracked"
            value={totalProducts}
            sub="Electronics indexed"
            icon={Package}
            iconColor="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
          />
          <KPICard
            label="Active platforms"
            value={sourceStats.length}
            sub="Live data sources"
            icon={Globe}
            iconColor="bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400"
          />
          <KPICard
            label="Total listings"
            value={totalListings}
            sub="Price data points"
            icon={Store}
            iconColor="bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400"
          />
          <KPICard
            label="Searches today"
            value={searchesToday}
            sub={`${totalSearches.toLocaleString("en-IN")} total`}
            icon={Search}
            iconColor="bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <BarChart3 className="h-3.5 w-3.5" />
              </div>
              <h2 className="text-sm font-bold">Products by category</h2>
            </div>
            <CategoryBarChart
              data={categoryStats.map((c) => ({ category: c.category, count: c._count.id }))}
            />
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
              <h2 className="text-sm font-bold">Platform split</h2>
            </div>
            <SourcePieChart
              data={sourceStats.map((s) => ({
                source: s.source,
                count: s._count.id,
                avgPrice: s._avg.price != null ? Math.round(s._avg.price) : null,
              }))}
            />
          </div>
        </div>

        {/* Platform details + Recent searches */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <Globe className="h-3.5 w-3.5" />
              </div>
              <h2 className="text-sm font-bold">Platform details</h2>
            </div>
            <div className="divide-y divide-border">
              {sourceStats.map((s) => (
                <div key={s.source} className="flex items-center justify-between py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${SOURCE_DOT[s.source] ?? "bg-muted-foreground"}`} />
                    <div>
                      <p className="text-sm font-semibold">{SOURCE_LABELS[s.source] ?? s.source}</p>
                      <p className="text-xs text-muted-foreground">{s._count.id} listings</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {s._avg.price != null ? (
                      <>
                        <p className="text-sm font-bold">
                          ₹{Math.round(s._avg.price).toLocaleString("en-IN")}
                        </p>
                        <p className="text-xs text-muted-foreground">avg price</p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">No data</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Search className="h-3.5 w-3.5" />
              </div>
              <h2 className="text-sm font-bold">Recent searches</h2>
            </div>
            <RecentSearches searches={recentSearches} />
          </div>
        </div>
      </div>
    </div>
  );
}
