"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type DataPoint = {
  date: string;
  vijaysales?: number;
  amazon?: number;
  flipkart?: number;
};

const SOURCE_CONFIG = {
  vijaysales: { label: "Vijay Sales", color: "#f97316", dotColor: "#ea6c0a" },
  amazon:     { label: "Amazon.in",   color: "#eab308", dotColor: "#ca9a07" },
  flipkart:   { label: "Flipkart",    color: "#3b82f6", dotColor: "#2563eb" },
} as const;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatINR(v: number) {
  return `₹${v.toLocaleString("en-IN")}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card/95 backdrop-blur p-3.5 shadow-xl text-xs min-w-[160px]">
      <p className="font-bold text-foreground mb-2.5 pb-2 border-b border-border">{formatDate(label)}</p>
      {payload
        .filter((e: { value: number }) => e.value != null)
        .sort((a: { value: number }, b: { value: number }) => a.value - b.value)
        .map((entry: { name: string; value: number; color: string }) => (
          <div key={entry.name} className="flex items-center justify-between gap-6 py-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
              <span className="text-muted-foreground">
                {SOURCE_CONFIG[entry.name as keyof typeof SOURCE_CONFIG]?.label ?? entry.name}
              </span>
            </div>
            <span className="font-bold text-foreground">{formatINR(entry.value)}</span>
          </div>
        ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomLegend({ payload }: any) {
  return (
    <div className="flex flex-wrap justify-center gap-4 pt-3 pb-1">
      {payload?.map((entry: { value: string; color: string }) => (
        <div key={entry.value} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-6 h-0.5 rounded-full inline-block" style={{ background: entry.color }} />
          {SOURCE_CONFIG[entry.value as keyof typeof SOURCE_CONFIG]?.label ?? entry.value}
        </div>
      ))}
    </div>
  );
}

export function PriceHistoryChart({ productId }: { productId: string }) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/price-history/${productId}`)
      .then((r) => r.json())
      .then((j) => setData(j.history ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  const activeSources = (Object.keys(SOURCE_CONFIG) as (keyof typeof SOURCE_CONFIG)[])
    .filter((s) => data.some((d) => d[s] != null));

  // Compute overall min/max for reference lines
  const allValues = data.flatMap((d) => activeSources.flatMap((s) => (d[s] != null ? [d[s]!] : [])));
  const globalMin = allValues.length ? Math.min(...allValues) : null;
  const globalMax = allValues.length ? Math.max(...allValues) : null;

  // Trend: compare first and last available value per source
  const trends = activeSources.map((s) => {
    const vals = data.flatMap((d) => (d[s] != null ? [d[s]!] : []));
    if (vals.length < 2) return null;
    const diff = vals[vals.length - 1] - vals[0];
    return { source: s, diff };
  }).filter(Boolean);

  if (!data.length || !activeSources.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
          <TrendingUp className="h-7 w-7" />
        </div>
        <p className="font-semibold mb-1">Price history is building up</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Data is recorded each time prices are refreshed. Check back after a few days to see trends.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <TrendingUp className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="font-semibold text-sm leading-none">Price History</p>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days · all platforms</p>
          </div>
        </div>

        {/* trend chips */}
        {trends.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {trends.map((t) => {
              if (!t) return null;
              const cfg = SOURCE_CONFIG[t.source as keyof typeof SOURCE_CONFIG];
              const up = t.diff > 0;
              const flat = t.diff === 0;
              return (
                <div
                  key={t.source}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border bg-card"
                  style={{ borderColor: cfg.color + "40" }}
                >
                  <span className="font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                  {flat ? (
                    <Minus className="h-3 w-3 text-muted-foreground" />
                  ) : up ? (
                    <TrendingUp className="h-3 w-3 text-rose-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-emerald-500" />
                  )}
                  <span className={flat ? "text-muted-foreground" : up ? "text-rose-500 font-semibold" : "text-emerald-500 font-semibold"}>
                    {flat ? "Stable" : `${up ? "+" : ""}${formatINR(t.diff)}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* min/max callouts */}
      {globalMin != null && globalMax != null && globalMin !== globalMax && (
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl px-3.5 py-2 text-xs font-medium">
            <TrendingDown className="h-3.5 w-3.5" />
            30-day low: <span className="font-bold ml-1">{formatINR(globalMin)}</span>
          </div>
          <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-xl px-3.5 py-2 text-xs font-medium">
            <TrendingUp className="h-3.5 w-3.5" />
            30-day high: <span className="font-bold ml-1">{formatINR(globalMax)}</span>
          </div>
        </div>
      )}

      {/* chart */}
      <div className="rounded-2xl border border-border bg-secondary/20 p-4 pt-5">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.6} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              tickFormatter={(v: number) =>
                v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` :
                v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` :
                `₹${v}`
              }
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={60}
              domain={["auto", "auto"]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
            {globalMin != null && (
              <ReferenceLine
                y={globalMin}
                stroke="#10b981"
                strokeDasharray="4 3"
                strokeWidth={1}
                opacity={0.5}
              />
            )}
            {activeSources.map((source) => (
              <Line
                key={source}
                type="monotone"
                dataKey={source}
                name={source}
                stroke={SOURCE_CONFIG[source].color}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: SOURCE_CONFIG[source].dotColor, strokeWidth: 0 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] text-muted-foreground/50 text-center">
        Simulated history based on scraped prices · refreshes with each price update
      </p>
    </div>
  );
}
