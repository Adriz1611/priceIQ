"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingCart, AlertCircle } from "lucide-react";

interface Props {
  query: string;
}

const SOURCES = ["Amazon.in", "Flipkart", "Vijay Sales"];

export function LiveSearchTrigger({ query }: Props) {
  const router = useRouter();
  const triggered = useRef(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (triggered.current || !query.trim()) return;
    triggered.current = true;

    let stepInterval: ReturnType<typeof setInterval>;
    stepInterval = setInterval(() => {
      setStep((s) => (s < SOURCES.length - 1 ? s + 1 : s));
    }, 3500);

    fetch("/api/search/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    })
      .then((res) => res.json())
      .then((data) => {
        clearInterval(stepInterval);
        if (data.success && data.productId) {
          router.push(`/product/${data.productId}`);
        } else {
          setError("No products found on any platform. Try a different query.");
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
      <div className="py-20 flex flex-col items-center gap-3 text-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="py-20 flex flex-col items-center gap-6 text-center">
      <div className="flex items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="font-medium">Searching live across platforms…</span>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {SOURCES.map((src, i) => (
          <div
            key={src}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-lg border text-sm transition-all duration-500 ${
              i <= step
                ? "border-primary/40 bg-primary/5 text-foreground"
                : "border-border bg-muted/30 text-muted-foreground"
            }`}
          >
            {i <= step ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
            ) : (
              <ShoppingCart className="h-3.5 w-3.5 shrink-0 opacity-40" />
            )}
            {src}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground max-w-xs">
        Fetching real-time prices for <strong className="text-foreground">"{query}"</strong>. This may take up to 30 seconds.
      </p>
    </div>
  );
}
