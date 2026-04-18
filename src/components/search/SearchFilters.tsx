"use client";

import { useRouter, useSearchParams } from "next/navigation";

const SORT_OPTIONS = [
  { value: "", label: "Relevance" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "rating", label: "Top rated" },
];

const SOURCES = [
  { value: "", label: "All sources" },
  { value: "amazon", label: "Amazon.in" },
  { value: "flipkart", label: "Flipkart" },
  { value: "vijaysales", label: "Vijay Sales" },
];

interface SearchFiltersProps {
  categories: string[];
}

export function SearchFilters({ categories }: SearchFiltersProps) {
  const router = useRouter();
  const params = useSearchParams();

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/search?${next.toString()}`);
  };

  const active = (key: string, value: string) => (params.get(key) ?? "") === value;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Sort
        </p>
        <div className="space-y-0.5">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => set("sort", opt.value)}
              className={`w-full text-left text-sm px-2.5 py-1.5 rounded-md transition-colors ${
                active("sort", opt.value)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Source
        </p>
        <div className="space-y-0.5">
          {SOURCES.map((s) => (
            <button
              key={s.value}
              onClick={() => set("source", s.value)}
              className={`w-full text-left text-sm px-2.5 py-1.5 rounded-md transition-colors ${
                active("source", s.value)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {categories.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Category
          </p>
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => set("category", "")}
              className={`text-left text-sm px-2.5 py-1.5 rounded-md transition-colors ${
                !params.get("category")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              All categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => set("category", params.get("category") === cat ? "" : cat)}
                className={`text-left text-sm px-2.5 py-1.5 rounded-md transition-colors ${
                  params.get("category") === cat
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
