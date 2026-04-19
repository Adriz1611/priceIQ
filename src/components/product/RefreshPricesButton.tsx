"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function RefreshPricesButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/product/${productId}/refresh`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(`Updated prices from ${data.updated} platform${data.updated !== 1 ? "s" : ""}`);
        router.refresh();
      } else {
        toast.error("Could not fetch live prices. Try again.");
      }
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
      <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Refreshing…" : "Refresh prices"}
    </Button>
  );
}
