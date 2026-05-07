"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";

type DataPoint = {
  date: string;
  vijaysales?: number;
  amazon?: number;
  flipkart?: number;
};

const SOURCE_CONFIG = {
  vijaysales: { label: "Vijay Sales", color: "#f97316" },
  amazon:     { label: "Amazon.in",   color: "#eab308" },
  flipkart:   { label: "Flipkart",    color: "#3b82f6" },
} as const;

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-lg text-xs space-y-1.5">
      <p className="font-semibold text-foreground mb-2">{formatDate(label)}</p>
      {payload.map((entry: { name: string; value: number; color: string }) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: entry.color }} />
          <span className="text-muted-foreground">
            {SOURCE_CONFIG[entry.name as keyof typeof SOURCE_CONFIG]?.label ?? entry.name}:
          </span>
          <span className="font-semibold text-foreground">
            ₹{entry.value.toLocaleString("en-IN")}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PriceHistoryChart({ productId }: { productId: string }) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/price-history/${productId}`)
      .then((r) => r.json())
      .then((j) => setData(j.history ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
          <TrendingUp className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold">No price history yet</p>
        <p className="text-xs text-muted-foreground mt-1">History builds up as prices are refreshed over time.</p>
      </div>
    );
  }

  const activeSources = (Object.keys(SOURCE_CONFIG) as (keyof typeof SOURCE_CONFIG)[])
    .filter((s) => data.some((d) => d[s] != null));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <TrendingUp className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">Price History</p>
          <p className="text-xs text-muted-foreground mt-0.5">Last 30 days across platforms</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 pt-6">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={56}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => (
                <span style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>
                  {SOURCE_CONFIG[value as keyof typeof SOURCE_CONFIG]?.label ?? value}
                </span>
              )}
            />
            {activeSources.map((source) => (
              <Line
                key={source}
                type="monotone"
                dataKey={source}
                name={source}
                stroke={SOURCE_CONFIG[source].color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
