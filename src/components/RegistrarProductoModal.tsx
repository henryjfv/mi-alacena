"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { addDays, formatDate } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  estimatedDurationDays: number;
  store: { name: string };
};

export function RegistrarProductoModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [price, setPrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [duration, setDuration] = useState(30);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (open) {
      setPurchaseDate(today);
      setPrice("");
      setError("");
      fetch("/api/products")
        .then((r) => r.json())
        .then((data: Product[]) => {
          setProducts(data);
          if (data.length > 0) {
            setProductId(data[0].id);
            setDuration(data[0].estimatedDurationDays);
          }
        });
    }
  }, [open, today]);

  function handleProductChange(id: string) {
    setProductId(id);
    const product = products.find((p) => p.id === id);
    if (product) setDuration(product.estimatedDurationDays);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        purchaseDate,
        price: parseFloat(price) || 0,
        estimatedDurationDays: duration,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      setError("No se pudo registrar. Intenta de nuevo.");
    }
  }

  const runOutDate = purchaseDate
    ? addDays(new Date(purchaseDate + "T12:00:00"), duration)
    : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">+ Registrar producto</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar en inventario</DialogTitle>
        </DialogHeader>

        {products.length === 0 ? (
          <div className="py-6 text-center space-y-2">
            <p className="text-sm text-gray-500">No tienes productos en tu catálogo.</p>
            <p className="text-xs text-gray-400">Ve al Catálogo y agrega tus productos primero.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Producto *</label>
              <select
                value={productId}
                onChange={(e) => handleProductChange(e.target.value)}
                required
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.store.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Fecha de compra</label>
                <Input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Precio (opcional)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                ¿Cuánto dura? <span className="text-emerald-600 font-semibold">{duration} días</span>
              </label>
              <input
                type="range"
                min={1}
                max={365}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full accent-emerald-600"
              />
              {runOutDate && (
                <p className="text-xs text-gray-500">
                  Se acabará aprox. el{" "}
                  <span className="font-medium text-emerald-700">{formatDate(runOutDate)}</span>
                </p>
              )}
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
