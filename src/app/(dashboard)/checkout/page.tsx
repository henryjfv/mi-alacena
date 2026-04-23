"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Store } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addDays, formatDate } from "@/lib/utils";

type CartItem = {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    unit: string;
    estimatedDurationDays: number;
    store: { name: string; color: string };
  };
};

type CheckoutItem = CartItem & {
  price: string;
  purchaseDate: string;
  duration: number;
};

export default function CheckoutPage() {
  const today = new Date().toISOString().split("T")[0];
  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch("/api/cart")
      .then((r) => r.json())
      .then((data: CartItem[]) => {
        setItems(
          data.map((item) => ({
            ...item,
            price: "",
            purchaseDate: today,
            duration: item.product.estimatedDurationDays,
          }))
        );
        setLoading(false);
      });
  }, []);

  const updateItem = (id: string, field: "price" | "purchaseDate" | "duration", value: string | number) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));

  const handleSubmit = async () => {
    setSubmitting(true);
    await Promise.all(
      items.map((item) =>
        fetch("/api/purchases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: item.product.id,
            purchaseDate: item.purchaseDate,
            price: parseFloat(item.price) || 0,
            quantity: item.quantity,
            estimatedDurationDays: item.duration,
          }),
        })
      )
    );
    await Promise.all(items.map((item) => fetch(`/api/cart?id=${item.id}`, { method: "DELETE" })));
    setSubmitting(false);
    setSubmitted(true);
  };

  const totalSpend = items.reduce((sum, i) => sum + (parseFloat(i.price) || 0), 0);

  const grouped = items.reduce((acc, item) => {
    const key = item.product.store.name;
    if (!acc[key]) acc[key] = { color: item.product.store.color, items: [] };
    acc[key].items.push(item);
    return acc;
  }, {} as Record<string, { color: string; items: CheckoutItem[] }>);

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <CheckCircle className="h-16 w-16 text-emerald-500" />
        <h2 className="text-xl font-bold text-gray-900">¡Compra registrada!</h2>
        <p className="text-sm text-gray-500">Tu inventario se ha actualizado automáticamente</p>
        <Button onClick={() => { setSubmitted(false); setLoading(true); fetch("/api/cart").then(r => r.json()).then(data => { setItems(data.map((item: CartItem) => ({ ...item, price: "", purchaseDate: today, duration: item.product.estimatedDurationDays }))); setLoading(false); }); }} variant="outline">
          Registrar otra compra
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <p className="text-sm">Cargando carrito...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
        <p className="text-gray-500 font-medium">Tu carrito está vacío</p>
        <p className="text-sm text-gray-400">Agrega productos al carrito antes de registrar una compra</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Registrar Compra</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ingresa los detalles de tu compra de hoy</p>
      </div>

      {Object.entries(grouped).map(([storeName, { color, items: storeItems }]) => (
        <Card key={storeName}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Store className="h-4 w-4" style={{ color }} />
              {storeName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {storeItems.map((item) => {
              const runOutDate = addDays(new Date(item.purchaseDate), item.duration);
              return (
                <div key={item.id} className="border border-gray-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-800">{item.product.name}</p>
                    <span className="text-xs text-gray-400">{item.product.unit}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Precio (COP)</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={item.price}
                        onChange={(e) => updateItem(item.id, "price", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Fecha de compra</label>
                      <Input
                        type="date"
                        value={item.purchaseDate}
                        onChange={(e) => updateItem(item.id, "purchaseDate", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <label className="text-xs text-gray-500">
                        Duración estimada: <span className="font-medium text-gray-700">{item.duration} días</span>
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={365}
                        value={item.duration}
                        onChange={(e) => updateItem(item.id, "duration", parseInt(e.target.value))}
                        className="w-full accent-emerald-600"
                      />
                      <p className="text-xs text-emerald-600">
                        Se acabará aprox. el {formatDate(runOutDate)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-4">
            <span className="font-medium text-gray-700">Total gastado:</span>
            <span className="text-xl font-bold text-gray-900">
              ${totalSpend.toLocaleString("es-CO")} COP
            </span>
          </div>
          <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Guardando..." : "Confirmar compra"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
