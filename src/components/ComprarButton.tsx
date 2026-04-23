"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ComprarButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleComprar() {
    setLoading(true);
    await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    router.push("/checkout");
  }

  return (
    <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={handleComprar} disabled={loading}>
      {loading ? "..." : "Comprar"}
    </Button>
  );
}
