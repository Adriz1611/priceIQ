"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ReScrapeButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleScrape = async () => {
    setLoading(true);
    toast.info("Scraping all platforms… this takes 3–5 minutes.");
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "x-scrape-secret": "changeme" },
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Done! Updated ${data.upserted} listings.`);
        router.refresh();
      } else {
        toast.error("Scrape failed. Check logs.");
      }
    } catch {
      toast.error("Network error during scrape.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleScrape} disabled={loading} size="sm">
      <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Scraping…" : "Re-scrape all products"}
    </Button>
  );
}
