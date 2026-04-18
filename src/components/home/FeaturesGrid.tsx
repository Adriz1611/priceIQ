import { Brain, ChartLine, Database, Globe, Search, Zap } from "lucide-react";

const FEATURES = [
  {
    icon: Globe,
    title: "3 Indian platforms",
    desc: "Live prices from Amazon.in, Flipkart, and Vijay Sales — scraped in real time so you always see the current deal.",
  },
  {
    icon: Brain,
    title: "AI comparison",
    desc: "LLaMA-3 analyses listings across all platforms and explains which one offers the best value for Indian buyers.",
  },
  {
    icon: ChartLine,
    title: "Price history",
    desc: "Track how prices move over time with interactive charts — one line per platform, 30-day rolling history.",
  },
  {
    icon: Search,
    title: "On-demand scraping",
    desc: "Search any product and the app instantly scrapes all three platforms to find real-time prices in INR.",
  },
  {
    icon: Database,
    title: "Structured storage",
    desc: "Every product, listing, and price snapshot is stored in PostgreSQL, enabling fast querying and trend analysis.",
  },
  {
    icon: Zap,
    title: "Fast & accurate",
    desc: "Vijay Sales GraphQL, Amazon HTTP, and Flipkart Playwright — each source scraped with the fastest method available.",
  },
];

export function FeaturesGrid() {
  return (
    <section className="py-16 border-b border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-2">How it works</h2>
          <p className="text-muted-foreground text-sm max-w-md">
            A complete data aggregation pipeline from live APIs to AI-generated insights.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4">
              <div className="shrink-0 mt-0.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted/50">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
