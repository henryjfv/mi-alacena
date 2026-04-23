"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Store } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Product = {
  id: string;
  name: string;
  unit: string;
  estimatedDurationDays: number;
  store: { id: string; name: string; color: string };
  category: { id: string; name: string } | null;
};

type StoreOption = { id: string; name: string; color: string };

const STORE_COLORS = [
  "#10b981", "#6366f1", "#f59e0b", "#ef4444",
  "#3b82f6", "#ec4899", "#8b5cf6", "#14b8a6",
];

function NuevoProductoModal({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [stores, setStores] = useState<StoreOption[]>([]);

  // producto
  const [name, setName] = useState("");
  const [storeId, setStoreId] = useState("");
  const [unit, setUnit] = useState("unidad");
  const [days, setDays] = useState("30");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // nueva tienda
  const [showNewStore, setShowNewStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreColor, setNewStoreColor] = useState(STORE_COLORS[0]);
  const [savingStore, setSavingStore] = useState(false);
  const [storeError, setStoreError] = useState("");

  function loadStores() {
    return fetch("/api/stores")
      .then((r) => r.json())
      .then((data: StoreOption[]) => {
        setStores(data);
        if (data.length > 0 && !storeId) setStoreId(data[0].id);
        return data;
      });
  }

  useEffect(() => {
    if (open) {
      loadStores().then((data) => {
        if (data.length === 0) setShowNewStore(true);
      });
    } else {
      setName(""); setUnit("unidad"); setDays("30");
      setError(""); setShowNewStore(false);
      setNewStoreName(""); setStoreError("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleCreateStore() {
    if (!newStoreName.trim()) return;
    setSavingStore(true);
    setStoreError("");
    const res = await fetch("/api/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newStoreName.trim(), color: newStoreColor }),
    });
    setSavingStore(false);
    if (res.ok) {
      const created = await res.json();
      setStores((prev) => [...prev, created]);
      setStoreId(created.id);
      setNewStoreName("");
      setShowNewStore(false);
    } else {
      setStoreError("No se pudo crear la tienda.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !storeId) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), storeId, unit, estimatedDurationDays: Number(days) }),
    });
    setSaving(false);
    if (res.ok) {
      setOpen(false);
      onCreated();
    } else {
      setError("No se pudo guardar. Intenta de nuevo.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Nuevo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo producto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Nombre *</label>
            <Input
              placeholder="Ej: Arroz, Leche, Aceite..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Tienda */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Tienda *</label>
              {!showNewStore && (
                <button
                  type="button"
                  onClick={() => setShowNewStore(true)}
                  className="text-xs text-emerald-600 hover:underline"
                >
                  + Nueva tienda
                </button>
              )}
            </div>

            {stores.length > 0 && !showNewStore && (
              <select
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                required
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}

            {showNewStore && (
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 space-y-2">
                <p className="text-xs font-medium text-emerald-700">Nueva tienda</p>
                <Input
                  placeholder="Nombre de la tienda"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  autoFocus
                />
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Color</p>
                  <div className="flex gap-2 flex-wrap">
                    {STORE_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewStoreColor(color)}
                        className="h-6 w-6 rounded-full transition-transform hover:scale-110"
                        style={{
                          backgroundColor: color,
                          outline: newStoreColor === color ? `2px solid ${color}` : "none",
                          outlineOffset: "2px",
                        }}
                      />
                    ))}
                  </div>
                </div>
                {storeError && <p className="text-xs text-red-500">{storeError}</p>}
                <div className="flex gap-2">
                  {stores.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowNewStore(false)}
                      className="text-xs text-gray-500 hover:underline"
                    >
                      Cancelar
                    </button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateStore}
                    disabled={savingStore || !newStoreName.trim()}
                    className="ml-auto"
                  >
                    {savingStore ? "Creando..." : "Crear tienda"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Unidad</label>
              <Input
                placeholder="kg, lt, unidad, docena..."
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Duración (días)</label>
              <Input
                type="number"
                min={1}
                max={365}
                value={days}
                onChange={(e) => setDays(e.target.value)}
              />
            </div>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !storeId}>
              {saving ? "Guardando..." : "Guardar producto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStore, setSelectedStore] = useState("Todas");
  function loadProducts() {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => { setProducts(data); setLoading(false); });
  }

  useEffect(() => { loadProducts(); }, []);

  const storeNames = ["Todas", ...Array.from(new Set(products.map((p) => p.store.name)))];

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesStore = selectedStore === "Todas" || p.store.name === selectedStore;
    return matchesSearch && matchesStore;
  });

  const grouped = filtered.reduce((acc, product) => {
    const key = product.store.name;
    if (!acc[key]) acc[key] = { color: product.store.color, items: [] };
    acc[key].items.push(product);
    return acc;
  }, {} as Record<string, { color: string; items: Product[] }>);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catálogo</h1>
          <p className="text-sm text-gray-500 mt-0.5">{products.length} productos registrados</p>
        </div>
        <NuevoProductoModal onCreated={loadProducts} />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar producto..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {storeNames.map((store) => (
          <button
            key={store}
            onClick={() => setSelectedStore(store)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedStore === store
                ? "bg-emerald-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {store}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">Cargando productos...</p>
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm font-medium text-gray-500">No tienes productos registrados</p>
          <p className="text-xs mt-1">Agrega tu primer producto con el botón "Nuevo"</p>
        </div>
      )}

      {Object.entries(grouped).map(([storeName, { color, items }]) => (
        <Card key={storeName}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Store className="h-4 w-4" style={{ color }} />
              {storeName}
              <span className="text-xs font-normal text-gray-400">({items.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {items.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between py-2.5 px-1 border-b border-gray-50 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{product.name}</p>
                  <p className="text-xs text-gray-400">{product.unit} · dura ~{product.estimatedDurationDays} días</p>
                </div>
                <div className="flex items-center gap-2">
                  {product.category && (
                    <Badge variant="secondary">{product.category.name}</Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {!loading && filtered.length === 0 && products.length > 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">No hay productos que coincidan</p>
        </div>
      )}
    </div>
  );
}
