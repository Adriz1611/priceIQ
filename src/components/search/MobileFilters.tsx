"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { SearchFilters } from "./SearchFilters";

interface Props {
  categories: string[];
}

export function MobileFilters({ categories }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border bg-card text-sm font-semibold hover:bg-secondary transition-colors shrink-0"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl border-t border-border p-6 max-h-[80vh] overflow-y-auto shadow-2xl">
            {/* Handle bar */}
            <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />
            <div className="flex items-center justify-between mb-6">
              <span className="font-bold text-base">Filters</span>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SearchFilters categories={categories} onSelect={() => setOpen(false)} />
          </div>
        </>
      )}
    </>
  );
}
