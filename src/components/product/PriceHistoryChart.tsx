"use client";

import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS: Record<string, string> = {
  vijaysales: "#ea580c",
  amazon: "#ca8a04",
  flipkart: "#2563eb",
};

const LABELS: Record<string, string> = {
  vijaysales: "Vijay Sales",
  amazon: "Amazon.in",
  flipkart: "Flipkart",
};

type Row = Record<string, string | number>;

export function PriceHistoryChart({ productId }: { productId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/price-history/${productId}`)
      .then((r) => r.json())
      .then(({ data }: { data: Record<string, { date: string; price: number }[]> }) => {
        const dates = new Set<string>();
        Object.values(data).forEach((es) => es.forEach((e) => dates.add(e.date)));
        const sorted = [...dates].sort();
        const chartRows: Row[] = sorted.map((date) => {
          const row: Row = { date };
          Object.entries(data).forEach(([src, entries]) => {
            const found = entries.find((e) => e.date === date);
            if (found) row[src] = found.price;
          });
          return row;
        });
        setRows(chartRows);
        setSources(Object.keys(data));
      })
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) return <Skeleton className="h-56 w-full rounded-lg" />;
  if (!rows.length) return <p className="text-sm text-muted-foreground">No price history available.</p>;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={rows} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickFormatter={(v) => v.slice(5)}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickFormatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`}
          width={52}
        />
        <Tooltip
          formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`]}
          labelFormatter={(l) => `Date: ${l}`}
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            fontSize: 12,
          }}
        />
        <Legend
          formatter={(v) => LABELS[v] ?? v}
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
        {sources.map((src) => (
          <Line
            key={src}
            type="monotone"
            dataKey={src}
            stroke={COLORS[src] ?? "#888"}
            strokeWidth={1.5}
            dot={false}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
