"use client";

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const LABELS: Record<string, string> = {
  vijaysales: "Vijay Sales",
  amazon: "Amazon.in",
  flipkart: "Flipkart",
};

const COLORS: Record<string, string> = {
  vijaysales: "#f97316",
  amazon: "#d97706",
  flipkart: "#2563eb",
};

const DEFAULT_COLORS = ["#6366f1", "#10b981", "#f59e0b"];

interface CustomLegendProps {
  payload?: Array<{ value: string; color: string; payload: { count: number; avgPrice: number | null } }>;
}

function CustomLegend({ payload }: CustomLegendProps) {
  if (!payload?.length) return null;
  return (
    <div className="flex flex-col gap-2 mt-3">
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: entry.color }} />
            <span className="text-foreground font-medium">{entry.value}</span>
          </div>
          <span className="text-muted-foreground tabular-nums">
            {entry.payload.count} listings
            {entry.payload.avgPrice != null && (
              <> · ₹{entry.payload.avgPrice.toLocaleString("en-IN")}</>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

export function SourcePieChart({
  data,
}: {
  data: { source: string; count: number; avgPrice: number | null }[];
}) {
  const labeled = data.map((d) => ({
    ...d,
    name: LABELS[d.source] ?? d.source,
    fill: COLORS[d.source],
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={labeled}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={78}
            paddingAngle={3}
            strokeWidth={0}
          >
            {labeled.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.fill ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [Number(value) + " listings", name]}
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "10px",
              fontSize: 12,
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <CustomLegend payload={labeled.map((d) => ({ value: d.name, color: d.fill ?? "#6366f1", payload: d }))} />
    </div>
  );
}
