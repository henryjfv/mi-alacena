"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Search, Store, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

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
  "#10b981",
  "#6366f1",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
];

function getDefaultStoreId(stores: StoreOption[], currentStoreId = "") {
  if (stores.some((store) => store.id === currentStoreId)) {
    return currentStoreId;
  }

  return stores[0]?.id || "";
}

function StoreColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-500">Color</p>
      <div className="flex flex-wrap gap-2">
        {STORE_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className="h-6 w-6 rounded-full transition-transform hover:scale-110"
            style={{
              backgroundColor: color,
              outline: value === color ? `2px solid ${color}` : "none",
              outlineOffset: "2px",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function StoreInlineForm({
  title,
  stores,
  selectedStoreId,
  onSelectStore,
  showNewStore,
  onShowNewStoreChange,
  newStoreName,
  onNewStoreNameChange,
  newStoreColor,
  onNewStoreColorChange,
  onCreateStore,
  savingStore,
  storeError,
}: {
  title: string;
  stores: StoreOption[];
  selectedStoreId: string;
  onSelectStore: (value: string) => void;
  showNewStore: boolean;
  onShowNewStoreChange: (value: boolean) => void;
  newStoreName: string;
  onNewStoreNameChange: (value: string) => void;
  newStoreColor: string;
  onNewStoreColorChange: (value: string) => void;
  onCreateStore: () => Promise<void>;
  savingStore: boolean;
  storeError: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">Tienda *</label>
        {!showNewStore && (
          <button
            type="button"
            onClick={() => onShowNewStoreChange(true)}
            className="text-xs text-emerald-600 hover:underline"
          >
            + Nueva tienda
          </button>
        )}
      </div>

      {stores.length > 0 && !showNewStore && (
        <select
          value={selectedStoreId}
          onChange={(e) => onSelectStore(e.target.value)}
          required
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
      )}

      {showNewStore && (
        <div className="space-y-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
          <p className="text-xs font-medium text-emerald-700">{title}</p>
          <Input
            placeholder="Nombre de la tienda"
            value={newStoreName}
            onChange={(e) => onNewStoreNameChange(e.target.value)}
            autoFocus
          />
          <StoreColorPicker value={newStoreColor} onChange={onNewStoreColorChange} />
          {storeError && <p className="text-xs text-red-500">{storeError}</p>}
          <div className="flex gap-2">
            {stores.length > 0 && (
              <button
                type="button"
                onClick={() => onShowNewStoreChange(false)}
                className="text-xs text-gray-500 hover:underline"
              >
                Cancelar
              </button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={onCreateStore}
              disabled={savingStore || !newStoreName.trim()}
              className="ml-auto"
            >
              {savingStore ? "Creando..." : "Crear tienda"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function NuevoProductoModal({
  onCreated,
  stores,
  reloadStores,
}: {
  onCreated: () => void;
  stores: StoreOption[];
  reloadStores: () => Promise<StoreOption[]>;
}) {
  const [open, setOpen] = useState(false);
  const [availableStores, setAvailableStores] = useState<StoreOption[]>(stores);
  const [name, setName] = useState("");
  const [storeId, setStoreId] = useState("");
  const [unit, setUnit] = useState("unidad");
  const [days, setDays] = useState("30");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showNewStore, setShowNewStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreColor, setNewStoreColor] = useState(STORE_COLORS[0]);
  const [savingStore, setSavingStore] = useState(false);
  const [storeError, setStoreError] = useState("");

  async function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      setName("");
      setUnit("unidad");
      setDays("30");
      setError("");
      setShowNewStore(false);
      setNewStoreName("");
      setNewStoreColor(STORE_COLORS[0]);
      setStoreError("");
      setAvailableStores(stores);
      setStoreId(getDefaultStoreId(stores));
      return;
    }

    const data = await reloadStores();
    setAvailableStores(data);
    setStoreId((current) => getDefaultStoreId(data, current));
    setShowNewStore(data.length === 0);
  }

  const displayedStores = open ? availableStores : stores;
  const activeStoreId = getDefaultStoreId(displayedStores, storeId);

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

    if (!res.ok) {
      setStoreError("No se pudo crear la tienda.");
      return;
    }

    const created = (await res.json()) as StoreOption;
    const data = await reloadStores();
    setAvailableStores(data);
    setStoreId(created.id);
    setNewStoreName("");
    setShowNewStore(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !activeStoreId) return;

    setSaving(true);
    setError("");
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        storeId: activeStoreId,
        unit,
        estimatedDurationDays: Number(days),
      }),
    });
    setSaving(false);

    if (!res.ok) {
      setError("No se pudo guardar. Intenta de nuevo.");
      return;
    }

    setOpen(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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

          <StoreInlineForm
            title="Nueva tienda"
            stores={displayedStores}
            selectedStoreId={activeStoreId}
            onSelectStore={setStoreId}
            showNewStore={showNewStore}
            onShowNewStoreChange={setShowNewStore}
            newStoreName={newStoreName}
            onNewStoreNameChange={setNewStoreName}
            newStoreColor={newStoreColor}
            onNewStoreColorChange={setNewStoreColor}
            onCreateStore={handleCreateStore}
            savingStore={savingStore}
            storeError={storeError}
          />

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
            <Button type="button" variant="outline" onClick={() => void handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !activeStoreId}>
              {saving ? "Guardando..." : "Guardar producto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditarProductoModal({
  product,
  stores,
  reloadStores,
  onSaved,
}: {
  product: Product;
  stores: StoreOption[];
  reloadStores: () => Promise<StoreOption[]>;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [availableStores, setAvailableStores] = useState<StoreOption[]>(stores);
  const [name, setName] = useState(product.name);
  const [storeId, setStoreId] = useState(product.store.id);
  const [unit, setUnit] = useState(product.unit);
  const [days, setDays] = useState(String(product.estimatedDurationDays));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showNewStore, setShowNewStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreColor, setNewStoreColor] = useState(STORE_COLORS[0]);
  const [savingStore, setSavingStore] = useState(false);
  const [storeError, setStoreError] = useState("");

  async function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      return;
    }

    setName(product.name);
    setStoreId(product.store.id);
    setUnit(product.unit);
    setDays(String(product.estimatedDurationDays));
    setError("");
    setShowNewStore(false);
    setNewStoreName("");
    setNewStoreColor(STORE_COLORS[0]);
    setStoreError("");

    const data = await reloadStores();
    setAvailableStores(data);
    setStoreId((current) => getDefaultStoreId(data, current || product.store.id));
  }

  const displayedStores = open ? availableStores : stores;
  const activeStoreId = getDefaultStoreId(displayedStores, storeId);

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

    if (!res.ok) {
      setStoreError("No se pudo crear la tienda.");
      return;
    }

    const created = (await res.json()) as StoreOption;
    const data = await reloadStores();
    setAvailableStores(data);
    setStoreId(created.id);
    setNewStoreName("");
    setShowNewStore(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !activeStoreId) return;

    setSaving(true);
    setError("");
    const res = await fetch("/api/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: product.id,
        name: name.trim(),
        storeId: activeStoreId,
        unit,
        estimatedDurationDays: Number(days),
      }),
    });
    setSaving(false);

    if (!res.ok) {
      setError("No se pudo guardar el producto.");
      return;
    }

    setOpen(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="h-8 w-8 rounded-lg text-gray-300 transition hover:bg-gray-100 hover:text-gray-700">
          <Pencil className="mx-auto h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar producto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Nombre *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </div>

          <StoreInlineForm
            title="Nueva tienda"
            stores={displayedStores}
            selectedStoreId={activeStoreId}
            onSelectStore={setStoreId}
            showNewStore={showNewStore}
            onShowNewStoreChange={setShowNewStore}
            newStoreName={newStoreName}
            onNewStoreNameChange={setNewStoreName}
            newStoreColor={newStoreColor}
            onNewStoreColorChange={setNewStoreColor}
            onCreateStore={handleCreateStore}
            savingStore={savingStore}
            storeError={storeError}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Unidad</label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
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
            <Button type="button" variant="outline" onClick={() => void handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !activeStoreId}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditarTiendaModal({
  store,
  onSaved,
}: {
  store: StoreOption;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(store.name);
  const [color, setColor] = useState(store.color);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) return;

    setName(store.name);
    setColor(store.color);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError("");
    const res = await fetch(`/api/stores/${store.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), color }),
    });
    setSaving(false);

    if (!res.ok) {
      setError("No se pudo guardar la tienda.");
      return;
    }

    setOpen(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="h-8 w-8 rounded-lg text-gray-300 transition hover:bg-gray-100 hover:text-gray-700">
          <Pencil className="mx-auto h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar tienda</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Nombre *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </div>
          <StoreColorPicker value={color} onChange={setColor} />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStore, setSelectedStore] = useState("Todas");
  const [actionError, setActionError] = useState("");

  async function loadStores() {
    const res = await fetch("/api/stores");
    const data = (await res.json()) as StoreOption[];
    setStores(data);
    return data;
  }

  async function loadProducts() {
    const res = await fetch("/api/products");
    const data = (await res.json()) as Product[];
    setProducts(data);
    return data;
  }

  function refreshCatalog() {
    setLoading(true);
    setActionError("");
    void loadProducts().finally(() => setLoading(false));
    void loadStores();
  }

  useEffect(() => {
    async function initializeCatalog() {
      const [productsRes, storesRes] = await Promise.all([fetch("/api/products"), fetch("/api/stores")]);
      const [productsData, storesData] = await Promise.all([
        productsRes.json() as Promise<Product[]>,
        storesRes.json() as Promise<StoreOption[]>,
      ]);

      setProducts(productsData);
      setStores(storesData);
      setLoading(false);
    }

    void initializeCatalog();
  }, []);

  async function handleDeleteProduct(product: Product) {
    const confirmed = window.confirm(
      `Vas a eliminar "${product.name}". Esto también borrará sus compras registradas y lo quitará del carrito.`
    );
    if (!confirmed) return;

    setActionError("");
    const res = await fetch(`/api/products?id=${product.id}`, { method: "DELETE" });
    if (!res.ok) {
      setActionError("No se pudo eliminar el producto.");
      return;
    }

    refreshCatalog();
  }

  async function handleDeleteStore(store: StoreOption) {
    const confirmed = window.confirm(`Vas a eliminar la tienda "${store.name}".`);
    if (!confirmed) return;

    setActionError("");
    const res = await fetch(`/api/stores/${store.id}`, { method: "DELETE" });
    if (res.ok) {
      refreshCatalog();
      return;
    }

    const data = await res.json().catch(() => null);
    setActionError(data?.error || "No se pudo eliminar la tienda.");
  }

  const storeNames = ["Todas", ...Array.from(new Set(products.map((product) => product.store.name)))];
  const activeStore = storeNames.includes(selectedStore) ? selectedStore : "Todas";

  const filtered = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesStore = activeStore === "Todas" || product.store.name === activeStore;
    return matchesSearch && matchesStore;
  });

  const grouped = filtered.reduce((acc, product) => {
    const key = product.store.id;
    if (!acc[key]) {
      acc[key] = { store: product.store, items: [] };
    }
    acc[key].items.push(product);
    return acc;
  }, {} as Record<string, { store: StoreOption; items: Product[] }>);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catálogo</h1>
          <p className="mt-0.5 text-sm text-gray-500">{products.length} productos registrados</p>
        </div>
        <NuevoProductoModal onCreated={refreshCatalog} stores={stores} reloadStores={loadStores} />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Buscar producto..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {storeNames.map((storeName) => (
          <button
            key={storeName}
            onClick={() => setSelectedStore(storeName)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              activeStore === storeName
                ? "bg-emerald-600 text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {storeName}
          </button>
        ))}
      </div>

      {actionError && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
          {actionError}
        </div>
      )}

      {loading && (
        <div className="py-12 text-center text-gray-400">
          <p className="text-sm">Cargando productos...</p>
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="py-12 text-center text-gray-400">
          <p className="text-sm font-medium text-gray-500">No tienes productos registrados</p>
          <p className="mt-1 text-xs">Agrega tu primer producto con el botón &quot;Nuevo&quot;</p>
        </div>
      )}

      {Object.values(grouped).map(({ store, items }) => (
        <Card key={store.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Store className="h-4 w-4" style={{ color: store.color }} />
                {store.name}
                <span className="text-xs font-normal text-gray-400">({items.length})</span>
              </CardTitle>
              <div className="flex items-center gap-1">
                <EditarTiendaModal store={store} onSaved={refreshCatalog} />
                <button
                  onClick={() => handleDeleteStore(store)}
                  className="h-8 w-8 rounded-lg text-gray-300 transition hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="mx-auto h-4 w-4" />
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {items.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between border-b border-gray-50 px-1 py-2.5 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{product.name}</p>
                  <p className="text-xs text-gray-400">
                    {product.unit} · dura ~{product.estimatedDurationDays} días
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {product.category && <Badge variant="secondary">{product.category.name}</Badge>}
                  <EditarProductoModal
                    product={product}
                    stores={stores}
                    reloadStores={loadStores}
                    onSaved={refreshCatalog}
                  />
                  <button
                    onClick={() => handleDeleteProduct(product)}
                    className="h-8 w-8 rounded-lg text-gray-300 transition hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="mx-auto h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {!loading && filtered.length === 0 && products.length > 0 && (
        <div className="py-12 text-center text-gray-400">
          <p className="text-sm">No hay productos que coincidan</p>
        </div>
      )}
    </div>
  );
}
