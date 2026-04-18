"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SUGGESTIONS = ["iPhone 15", "Samsung Galaxy S24", "OnePlus 12", "Sony WH-1000XM5", "Dell Inspiron"];

export function HeroSection() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <section className="border-b border-border bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center">
        <p className="text-sm font-medium text-primary mb-4">
          AI-Powered Data Aggregation
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">
          Compare products across
          <br />
          multiple sources
        </h1>
        <p className="text-base text-muted-foreground mb-10 max-w-lg mx-auto leading-relaxed">
          Compares real prices from Amazon.in, Flipkart, and Vijay Sales in one place.
          Track price trends and get AI-powered buying recommendations in ₹.
        </p>

        <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search iPhone 15, Samsung TV, boAt headphones..."
              className="pl-9 h-10"
              autoFocus
            />
          </div>
          <Button type="submit" className="h-10 px-5">
            Search
          </Button>
        </form>

        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
          <span className="text-muted-foreground">Try:</span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => router.push(`/search?q=${encodeURIComponent(s)}`)}
              className="text-primary hover:underline underline-offset-2"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
