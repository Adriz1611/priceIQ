"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

const PAGE_SIZE = 3;

interface RecentSearchesProps {
  searches: { query: string; resultsCount: number; searchedAt: Date }[];
}

export function RecentSearches({ searches }: RecentSearchesProps) {
  const [expanded, setExpanded] = useState(false);

  if (!searches.length) {
    return (
      <div className="py-8 flex flex-col items-center gap-2 text-center">
        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No searches yet.</p>
      </div>
    );
  }

  const visible = expanded ? searches : searches.slice(0, PAGE_SIZE);
  const remaining = searches.length - PAGE_SIZE;

  return (
    <div>
      <div className="divide-y divide-border">
        {visible.map((s, i) => (
          <div key={i} className="group flex items-center justify-between py-3 gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Search className="h-3 w-3 text-primary" />
              </div>
              <Link
                href={`/search?q=${encodeURIComponent(s.query)}`}
                className="text-sm font-medium hover:text-primary transition-colors truncate flex items-center gap-1 group-hover:underline underline-offset-2"
              >
                {s.query}
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity shrink-0" />
              </Link>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
              <span className={`font-medium ${s.resultsCount > 0 ? "text-green-600 dark:text-green-400" : "text-rose-500"}`}>
                {s.resultsCount} {s.resultsCount === 1 ? "result" : "results"}
              </span>
              <span className="hidden sm:block">
                {new Date(s.searchedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {searches.length > PAGE_SIZE && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground py-2 rounded-lg hover:bg-secondary transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              Show {remaining} more
            </>
          )}
        </button>
      )}
    </div>
  );
}
