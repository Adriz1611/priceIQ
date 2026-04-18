"use client";

import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const LABELS: Record<string, string> = {
  vijaysales: "Vijay Sales",
  amazon: "Amazon.in",
  flipkart: "Flipkart",
};

const COLORS = ["#2563eb", "#16a34a", "#ea580c"];

export function SourcePieChart({
  data,
}: {
  data: { source: string; count: number; avgPrice: number | null }[];
}) {
  const labeled = data.map((d) => ({ ...d, name: LABELS[d.source] ?? d.source }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={labeled}
          dataKey="count"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={75}
          label={({ name, percent }) =>
            `${(name ?? "").split(" ")[0]} ${((percent ?? 0) * 100).toFixed(0)}%`
          }
          labelLine={false}
        >
          {labeled.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [Number(value), "Listings"]}
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
