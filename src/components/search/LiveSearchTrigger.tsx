"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Search, Sparkles, Zap } from "lucide-react";

interface Props {
  query: string;
}

const PLATFORMS = [
  {
    name: "Amazon.in",
    color: "text-amber-600 dark:text-amber-400",
    activeBg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
    icon: "🛒",
  },
  {
    name: "Flipkart",
    color: "text-blue-600 dark:text-blue-400",
    activeBg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
    dot: "bg-blue-500",
    icon: "📦",
  },
  {
    name: "Vijay Sales",
    color: "text-orange-600 dark:text-orange-400",
    activeBg: "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800",
    dot: "bg-orange-500",
    icon: "🏪",
  },
];

export function LiveSearchTrigger({ query }: Props) {
  const router = useRouter();
  const triggered = useRef(false);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (triggered.current || !query.trim()) return;
    triggered.current = true;

    const stepInterval = setInterval(() => {
      setStep((s) => Math.min(s + 1, PLATFORMS.length - 1));
    }, 4000);

    fetch("/api/search/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    })
      .then((res) => res.json())
      .then((data) => {
        clearInterval(stepInterval);
        setStep(PLATFORMS.length - 1);
        if (data.success && data.productId) {
          setDone(true);
          setTimeout(() => router.push(`/product/${data.productId}`), 600);
        } else {
          setError("No products found on any platform. Try a different search.");
        }
      })
      .catch(() => {
        clearInterval(stepInterval);
        setError("Search failed. Please try again.");
      });

    return () => clearInterval(stepInterval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="py-24 flex flex-col items-center gap-5 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center justify-center shadow-sm">
          <AlertCircle className="h-9 w-9 text-rose-500" />
        </div>
        <div>
          <p className="text-base font-bold mb-2">No results found</p>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">{error}</p>
        </div>
        <a
          href="/search"
          className="text-sm font-semibold text-primary hover:underline underline-offset-4"
        >
          Try a different search →
        </a>
      </div>
    );
  }

  return (
    <div className="py-16 flex flex-col items-center gap-8 text-center animate-fade-in">
      {/* Animated icon */}
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
          {done ? (
            <CheckCircle2 className="h-9 w-9 text-white" />
          ) : (
            <Search className="h-9 w-9 text-white" />
          )}
        </div>
        {!done && (
          <>
            <span className="absolute -top-2 -right-2 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50" />
              <span className="relative inline-flex rounded-full h-5 w-5 bg-primary items-center justify-center">
                <Zap className="h-2.5 w-2.5 text-white" />
              </span>
            </span>
          </>
        )}
      </div>

      {/* Status text */}
      <div>
        <p className="text-lg font-bold mb-1.5">
          {done ? (
            <span className="text-primary font-bold">Found it! Redirecting…</span>
          ) : (
            "Searching live across platforms"
          )}
        </p>
        <p className="text-sm text-muted-foreground">
          Looking for{" "}
          <span className="font-semibold text-foreground">"{query}"</span>
        </p>
      </div>

      {/* Platform cards */}
      <div className="flex flex-col gap-2.5 w-full max-w-sm">
        {PLATFORMS.map((p, i) => {
          const isActive = i <= step;
          const isComplete = done || i < step;
          return (
            <div
              key={p.name}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-sm font-semibold transition-all duration-500 ${
                isActive
                  ? p.activeBg
                  : "border-border bg-secondary/40 text-muted-foreground"
              }`}
            >
              <span className="text-base shrink-0">{p.icon}</span>
              <span className={isActive ? p.color : ""}>{p.name}</span>
              <div className="ml-auto flex items-center gap-2">
                {isComplete ? (
                  <CheckCircle2 className="h-4.5 w-4.5 text-green-500" />
                ) : isActive ? (
                  <Loader2 className="h-4 w-4 animate-spin text-current opacity-60" />
                ) : (
                  <div className={`w-2 h-2 rounded-full ${p.dot} opacity-25`} />
                )}
                {isComplete && (
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Done
                  </span>
                )}
                {isActive && !isComplete && (
                  <span className="text-xs opacity-60 font-medium">Fetching…</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/60 rounded-xl px-4 py-2.5 max-w-sm">
        <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
        <span>Flipkart requires a browser — this may take up to 30 seconds</span>
      </div>
    </div>
  );
}
