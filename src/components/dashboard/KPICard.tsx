import { type LucideIcon } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  iconColor: string;
}

export function KPICard({ label, value, sub, icon: Icon, iconColor }: KPICardProps) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-5 card-lift">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {label}
          </p>
          <p className="text-3xl font-black tabular-nums tracking-tight leading-none mb-1">
            {typeof value === "number" ? value.toLocaleString("en-IN") : value}
          </p>
          {sub && (
            <p className="text-xs text-muted-foreground">{sub}</p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
