import Link from "next/link";

interface RecentSearchesProps {
  searches: { query: string; resultsCount: number; searchedAt: Date }[];
}

export function RecentSearches({ searches }: RecentSearchesProps) {
  if (!searches.length) {
    return <p className="text-sm text-muted-foreground">No searches yet.</p>;
  }

  return (
    <div className="divide-y divide-border">
      {searches.map((s, i) => (
        <div key={i} className="flex items-center justify-between py-2.5 text-sm">
          <Link
            href={`/search?q=${encodeURIComponent(s.query)}`}
            className="hover:text-primary transition-colors truncate max-w-[180px]"
          >
            {s.query}
          </Link>
          <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
            <span>{s.resultsCount} results</span>
            <span>{new Date(s.searchedAt).toLocaleDateString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
