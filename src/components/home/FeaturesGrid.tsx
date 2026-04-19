import { Brain, ChartLine, Database, Globe, Search, Zap } from "lucide-react";

const PLATFORMS_DEMO = [
  { name: "Amazon.in", price: "₹52,990", dot: "bg-amber-500", best: true },
  { name: "Flipkart", price: "₹54,999", dot: "bg-blue-500", best: false },
  { name: "Vijay Sales", price: "₹53,490", dot: "bg-orange-500", best: false },
];

const PLATFORM_METHODS = [
  { name: "Amazon.in", dot: "bg-amber-500", method: "HTTP scraping" },
  { name: "Flipkart", dot: "bg-blue-500", method: "Playwright browser" },
  { name: "Vijay Sales", dot: "bg-orange-500", method: "GraphQL API" },
];

export function FeaturesGrid() {
  return (
    <section className="py-24 border-t border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary mb-3">
            How it works
          </p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-[-0.02em] leading-tight max-w-xl">
            Everything you need to{" "}
            <span className="text-primary">buy smarter.</span>
          </h2>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* 1. AI Analysis — hero card, col-span-2 */}
          <div className="group card-lift sm:col-span-2 rounded-3xl border border-border bg-card p-7 flex flex-col">
            <div className="flex items-start justify-between mb-5">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <Brain className="h-5 w-5" />
              </div>
              <span className="text-6xl font-black text-border/60 tabular-nums select-none">01</span>
            </div>
            <h3 className="text-lg font-bold tracking-tight mb-2">AI-powered comparison</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              LLaMA 3.3 via Groq reads every listing and tells you exactly which platform gives the best value — price, ratings, and availability considered.
            </p>
            {/* Mini price comparison mockup */}
            <div className="mt-auto rounded-2xl border border-border bg-secondary/40 p-4 space-y-3">
              {PLATFORMS_DEMO.map(({ name, price, dot, best }) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    <span className="text-xs text-muted-foreground">{name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${best ? "text-foreground" : "text-muted-foreground"}`}>
                      {price}
                    </span>
                    {best && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                        Best
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Platforms — col-span-1 */}
          <div className="group card-lift rounded-3xl border border-border bg-card p-7 flex flex-col">
            <div className="flex items-start justify-between mb-5">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <Globe className="h-5 w-5" />
              </div>
              <span className="text-6xl font-black text-border/60 tabular-nums select-none">02</span>
            </div>
            <h3 className="text-lg font-bold tracking-tight mb-2">3 Indian platforms</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Live prices from the top Indian e-commerce sites, scraped with the fastest method per platform.
            </p>
            <div className="mt-auto divide-y divide-border">
              {PLATFORM_METHODS.map(({ name, dot, method }) => (
                <div key={name} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                    <span className="text-xs font-semibold">{name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{method}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. On-demand scraping */}
          <div className="group card-lift rounded-3xl border border-border bg-card p-7 flex flex-col">
            <div className="flex items-start justify-between mb-5">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <Search className="h-5 w-5" />
              </div>
              <span className="text-6xl font-black text-border/60 tabular-nums select-none">03</span>
            </div>
            <h3 className="font-bold tracking-tight mb-2">On-demand scraping</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              No cached stale data. Search a product and all three platforms are scraped live in real time.
            </p>
          </div>

          {/* 4. Price history */}
          <div className="group card-lift rounded-3xl border border-border bg-card p-7 flex flex-col">
            <div className="flex items-start justify-between mb-5">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <ChartLine className="h-5 w-5" />
              </div>
              <span className="text-6xl font-black text-border/60 tabular-nums select-none">04</span>
            </div>
            <h3 className="font-bold tracking-tight mb-2">Price history</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every scrape adds a data point. See how prices shift across platforms over time.
            </p>
          </div>

          {/* 5. Fast per platform */}
          <div className="group card-lift rounded-3xl border border-border bg-card p-7 flex flex-col">
            <div className="flex items-start justify-between mb-5">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <Zap className="h-5 w-5" />
              </div>
              <span className="text-6xl font-black text-border/60 tabular-nums select-none">05</span>
            </div>
            <h3 className="font-bold tracking-tight mb-2">Fast per source</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              GraphQL for Vijay Sales, HTTP for Amazon, Playwright for Flipkart — the fastest method per platform.
            </p>
          </div>

          {/* 6. Storage — full-width banner */}
          <div className="group card-lift sm:col-span-2 lg:col-span-3 rounded-3xl border border-border bg-card p-7 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
              <Database className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-bold tracking-tight">Structured storage</h3>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">PostgreSQL</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every product, listing, and price snapshot stored in PostgreSQL — enabling fast filtering, sorting, and analytics across everything tracked.
              </p>
            </div>
            <span className="text-6xl font-black text-border/60 tabular-nums select-none shrink-0 self-start sm:self-center">06</span>
          </div>

        </div>
      </div>
    </section>
  );
}
