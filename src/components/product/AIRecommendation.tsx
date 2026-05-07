"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Sparkles, Trophy, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface AIAnalysis {
  id: string;
  summary: string;
  recommendation: string;
  bestSource: string;
  confidenceNote?: string | null;
  generatedAt: string | Date;
}

const SOURCE_LABELS: Record<string, string> = {
  vijaysales: "Vijay Sales",
  amazon: "Amazon.in",
  flipkart: "Flipkart",
};

const SOURCE_COLORS: Record<string, string> = {
  vijaysales: "bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  amazon: "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  flipkart: "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
};

export function AIRecommendation({
  productId,
  cachedAnalysis,
}: {
  productId: string;
  cachedAnalysis?: AIAnalysis | null;
}) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(cachedAnalysis ?? null);
  const [loading, setLoading] = useState(!cachedAnalysis);
  const [refreshing, setRefreshing] = useState(false);

  const fetch_ = async (force = false) => {
    force ? setRefreshing(true) : setLoading(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setAnalysis(json.data);
        if (force) toast.success("Analysis refreshed");
      } else if (force) {
        toast.error(json.error ?? "Could not refresh analysis");
      }
    } catch {
      if (force) toast.error("Network error. Try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!cachedAnalysis) fetch_();
  }, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-semibold">Generating AI analysis…</p>
            <p className="text-xs text-muted-foreground">LLaMA 3.3 is comparing prices</p>
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
        <div className="pt-2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-10">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
          <Sparkles className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold mb-1">No analysis yet</p>
        <p className="text-xs text-muted-foreground mb-5">Generate an AI-powered buying recommendation</p>
        <Button size="sm" onClick={() => fetch_()} className="bg-primary text-primary-foreground hover:bg-primary/90">
          Generate analysis
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">AI Analysis</p>
            <p className="text-xs text-muted-foreground mt-0.5">LLaMA 3.3 via Groq</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetch_(true)}
          disabled={refreshing}
          className="h-8 text-xs text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Best source badge */}
      {analysis.bestSource && (
        <div className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border font-medium text-sm ${SOURCE_COLORS[analysis.bestSource] ?? "bg-secondary text-foreground border-border"}`}>
          <Trophy className="h-4 w-4" />
          Best deal on {SOURCE_LABELS[analysis.bestSource] ?? analysis.bestSource}
        </div>
      )}

      {/* Summary */}
      <div className="rounded-2xl border border-border bg-muted/30 p-5 space-y-4">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Summary</p>
          <p className="text-sm leading-relaxed">{analysis.summary}</p>
        </div>
        <div className="border-t border-border pt-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Recommendation</p>
          <p className="text-sm leading-relaxed">{analysis.recommendation}</p>
        </div>
        {analysis.confidenceNote && (
          <div className="border-t border-border pt-4 flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">{analysis.confidenceNote}</p>
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground/60">
        Generated {new Date(analysis.generatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
      </p>
    </div>
  );
}
