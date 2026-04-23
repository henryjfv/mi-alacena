"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Plus, Trash2, Store } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type CartItem = {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    unit: string;
    store: { name: string; color: string };
  };
};

export default function CarritoPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cart")
      .then((r) => r.json())
      .then((data) => { setItems(data); setLoading(false); });
  }, []);

  const removeItem = async (id: string) => {
    await fetch(`/api/cart?id=${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQty = (id: string, delta: number) =>
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i))
    );

  const grouped = items.reduce((acc, item) => {
    const key = item.product.store.name;
    if (!acc[key]) acc[key] = { color: item.product.store.color, items: [] };
    acc[key].items.push(item);
    return acc;
  }, {} as Record<string, { color: string; items: CartItem[] }>);

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
        <ShoppingCart className="h-12 w-12 text-gray-200" />
        <p className="text-gray-500 font-medium">Tu carrito está vacío</p>
        <p className="text-sm text-gray-400">Los productos agotados aparecen aquí automáticamente</p>
        <Link href="/menu">
          <Button variant="outline" size="sm">Ver catálogo</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Carrito</h1>
          <p className="text-sm text-gray-500 mt-0.5">Lo que necesitas comprar</p>
        </div>
        <span className="text-sm font-medium text-gray-500">{items.length} productos</span>
      </div>

      {Object.entries(grouped).map(([storeName, { color, items: storeItems }]) => (
        <Card key={storeName}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Store className="h-4 w-4" style={{ color }} />
              {storeName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {storeItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{item.product.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.product.unit}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-1">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="h-7 w-7 flex items-center justify-center text-gray-600 hover:text-gray-900"
                    >
                      −
                    </button>
                    <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="h-7 w-7 flex items-center justify-center text-gray-600 hover:text-gray-900"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="h-8 w-8 flex items-center justify-center text-gray-300 hover:text-red-400 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="flex gap-3">
        <Link href="/menu" className="flex-1">
          <Button variant="outline" className="w-full">
            <Plus className="h-4 w-4" />
            Agregar más
          </Button>
        </Link>
        <Link href="/checkout" className="flex-1">
          <Button className="w-full">
            Ir a pagar →
          </Button>
        </Link>
      </div>
    </div>
  );
}
