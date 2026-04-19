"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";

const SORT_OPTIONS = [
  { value: "", label: "Relevance" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "rating", label: "Top rated" },
];

const SOURCES = [
  { value: "", label: "All sources", dot: null },
  { value: "amazon", label: "Amazon.in", dot: "bg-amber-500" },
  { value: "flipkart", label: "Flipkart", dot: "bg-blue-500" },
  { value: "vijaysales", label: "Vijay Sales", dot: "bg-orange-500" },
];

interface SearchFiltersProps {
  categories: string[];
  onSelect?: () => void;
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2 px-1">
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-all duration-150 flex items-center justify-between gap-2 ${
        active
          ? "bg-foreground text-background font-semibold"
          : "text-foreground/70 hover:text-foreground hover:bg-secondary font-medium"
      }`}
    >
      <span className="truncate">{children}</span>
      {active && <Check className="h-3.5 w-3.5 shrink-0 opacity-80" />}
    </button>
  );
}

export function SearchFilters({ categories, onSelect }: SearchFiltersProps) {
  const router = useRouter();
  const params = useSearchParams();

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/search?${next.toString()}`);
    onSelect?.();
  };

  const active = (key: string, value: string) => (params.get(key) ?? "") === value;

  return (
    <div className="space-y-6">
      <FilterSection title="Sort">
        {SORT_OPTIONS.map((opt) => (
          <FilterButton
            key={opt.value}
            active={active("sort", opt.value)}
            onClick={() => set("sort", opt.value)}
          >
            {opt.label}
          </FilterButton>
        ))}
      </FilterSection>

      <FilterSection title="Platform">
        {SOURCES.map((s) => (
          <FilterButton
            key={s.value}
            active={active("source", s.value)}
            onClick={() => set("source", s.value)}
          >
            <span className="flex items-center gap-2">
              {s.dot && (
                <span className={`w-2 h-2 rounded-full shrink-0 ${active("source", s.value) ? "bg-background" : s.dot}`} />
              )}
              {s.label}
            </span>
          </FilterButton>
        ))}
      </FilterSection>

      {categories.length > 0 && (
        <FilterSection title="Category">
          <FilterButton active={!params.get("category")} onClick={() => set("category", "")}>
            All categories
          </FilterButton>
          {categories.map((cat) => (
            <FilterButton
              key={cat}
              active={params.get("category") === cat}
              onClick={() => set("category", params.get("category") === cat ? "" : cat)}
            >
              {cat}
            </FilterButton>
          ))}
        </FilterSection>
      )}
    </div>
  );
}
