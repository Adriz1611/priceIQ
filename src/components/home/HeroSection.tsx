"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";

const SUGGESTIONS = [
  "iPhone 15",
  "Samsung Galaxy S24",
  "Sony WH-1000XM5",
  "MacBook Air M2",
  "boAt Rockerz 450",
];

const PLATFORMS = [
  { name: "Amazon.in", dot: "bg-amber-500" },
  { name: "Flipkart", dot: "bg-blue-500" },
  { name: "Vijay Sales", dot: "bg-orange-500" },
];

export function HeroSection() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <section className="relative min-h-[calc(100vh-64px)] flex flex-col items-center justify-center overflow-hidden">
      {/* Dot grid background */}
      <div className="absolute inset-0 dot-grid opacity-60" />

      {/* Fade edges */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,transparent_40%,hsl(var(--background))_100%)]" />

      {/* Content */}
      <div className="relative w-full mx-auto max-w-4xl px-4 sm:px-6 text-center py-20">

        {/* Status badge */}
        <div className="animate-fade-in inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-border bg-background text-sm font-medium text-muted-foreground mb-10 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-green-500 blink" />
          Live prices from 3 Indian platforms
        </div>

        {/* Headline */}
        <h1 className="animate-slide-up text-[clamp(3rem,10vw,6rem)] font-black tracking-[-0.03em] leading-[1.0] mb-6">
          Compare prices,
          <br />
          <span className="text-primary">buy smarter.</span>
        </h1>

        {/* Subheadline */}
        <p
          className="animate-slide-up stagger-1 text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
          style={{ opacity: 0 }}
        >
          Search any electronics product and instantly see real-time prices from Amazon.in,
          Flipkart, and Vijay Sales — with an AI recommendation telling you exactly where to buy.
        </p>

        {/* Search */}
        <form
          onSubmit={handleSearch}
          className="animate-slide-up stagger-2 relative max-w-2xl mx-auto mb-5"
          style={{ opacity: 0 }}
        >
          <div
            className={`relative flex items-center gap-2 p-2 rounded-2xl border bg-background shadow-lg transition-all duration-200 ${
              focused
                ? "border-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.12)]"
                : "border-border shadow-[0_4px_24px_rgba(0,0,0,0.07)]"
            }`}
          >
            <Search className="absolute left-5 h-5 w-5 text-muted-foreground pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Search iPhone 15, Samsung TV, boAt headphones…"
              className="flex-1 h-12 pl-12 pr-4 bg-transparent text-base focus:outline-none placeholder:text-muted-foreground/60"
              autoFocus
            />
            <button
              type="submit"
              disabled={!query.trim()}
              className="h-12 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
            >
              Compare
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>

        {/* Platform indicators */}
        <div
          className="animate-slide-up stagger-3 flex items-center justify-center gap-4 mb-10"
          style={{ opacity: 0 }}
        >
          <span className="text-xs text-muted-foreground">Comparing across</span>
          {PLATFORMS.map((p) => (
            <span key={p.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
              {p.name}
            </span>
          ))}
        </div>

        {/* Suggestion chips */}
        <div
          className="animate-slide-up stagger-4 flex flex-wrap items-center justify-center gap-2"
          style={{ opacity: 0 }}
        >
          <span className="text-xs text-muted-foreground mr-1">Try:</span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => router.push(`/search?q=${encodeURIComponent(s)}`)}
              className="text-xs px-3.5 py-1.5 rounded-full border border-border bg-background hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all duration-200 text-muted-foreground shadow-sm"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-[linear-gradient(to_top,hsl(var(--background)),transparent)]" />
    </section>
  );
}
