"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import Image from "next/image";

interface Suggestion {
  id: string;
  name: string;
  category: string;
  brand: string | null;
  imageUrl: string | null;
  bestPrice: number | null;
}

export function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setValue(params.get("q") ?? ""); }, [params]);

  // Fetch autocomplete suggestions as user types (dropdown only — does NOT navigate)
  useEffect(() => {
    if (value.trim().length < 2) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(value.trim())}`);
        const data = await res.json();
        setSuggestions(data);
        setShowDropdown(data.length > 0);
      } catch { /* ignore */ }
    }, 200);
    return () => clearTimeout(t);
  }, [value]);

  const submitSearch = () => {
    setShowDropdown(false);
    const next = new URLSearchParams(params.toString());
    if (value.trim()) next.set("q", value.trim());
    else next.delete("q");
    router.push(`/search?${next.toString()}`);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectSuggestion = (id: string) => {
    setShowDropdown(false);
    router.push(`/product/${id}`);
  };

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={(e) => { e.preventDefault(); submitSearch(); }}>
        <button
          type="submit"
          aria-label="Search"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
        >
          <Search className="h-4 w-4" />
        </button>
        <Input
          value={value}
          onChange={(e) => { setValue(e.target.value); setShowDropdown(true); }}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder="Search products, brands, categories…"
          className="pl-9 pr-8"
        />
        {value && (
          <button
            type="button"
            onClick={() => { setValue(""); setSuggestions([]); setShowDropdown(false); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </form>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg overflow-hidden">
          <button
            type="button"
            onClick={submitSearch}
            className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted transition-colors border-b border-border text-sm"
          >
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Search for <span className="font-medium">&ldquo;{value}&rdquo;</span></span>
          </button>
          {suggestions.map((s) => (
            <button
              key={s.id}
              onClick={() => selectSuggestion(s.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors"
            >
              {s.imageUrl ? (
                <div className="shrink-0 w-9 h-9 rounded bg-muted overflow-hidden">
                  <Image src={s.imageUrl} alt={s.name} width={36} height={36} className="object-contain w-full h-full" />
                </div>
              ) : (
                <div className="shrink-0 w-9 h-9 rounded bg-muted flex items-center justify-center">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.category}</p>
              </div>
              {s.bestPrice != null && (
                <span className="shrink-0 text-sm font-semibold text-primary">
                  ₹{s.bestPrice.toLocaleString("en-IN")}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
