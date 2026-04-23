"use client";

import { useState, useEffect } from "react";
import { BarChart2, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

type Purchase = {
  id: string;
  price: number;
  purchaseDate: string;
  product: {
    name: string;
    store: { name: string; color: string };
  };
};

function getLastMonths(n: number) {
  const months = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleDateString("es-CO", { month: "short", year: "numeric" }),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
    });
  }
  return months;
}

export default function GastosPage() {
  const months = getLastMonths(3);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [prevPurchases, setPrevPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const selected = months[selectedIdx];
    const prev = months[selectedIdx + 1];
    setLoading(true);

    const fetchSelected = fetch(`/api/purchases?month=${selected.month}&year=${selected.year}`).then((r) => r.json());
    const fetchPrev = prev
      ? fetch(`/api/purchases?month=${prev.month}&year=${prev.year}`).then((r) => r.json())
      : Promise.resolve([]);

    Promise.all([fetchSelected, fetchPrev]).then(([current, previous]) => {
      setPurchases(current);
      setPrevPurchases(previous);
      setLoading(false);
    });
  }, [selectedIdx]);

  const byStore = purchases.reduce((acc, p) => {
    const key = p.product.store.name;
    if (!acc[key]) acc[key] = { color: p.product.store.color, total: 0 };
    acc[key].total += Number(p.price);
    return acc;
  }, {} as Record<string, { color: string; total: number }>);

  const total = Object.values(byStore).reduce((sum, s) => sum + s.total, 0);
  const maxStore = Math.max(...Object.values(byStore).map((s) => s.total), 1);

  const prevTotal = prevPurchases.reduce((sum, p) => sum + Number(p.price), 0);
  const diff = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gastos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Control de presupuesto mensual</p>
        </div>
        <BarChart2 className="h-5 w-5 text-gray-400" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {months.map((m, i) => (
          <button
            key={m.label}
            onClick={() => setSelectedIdx(i)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedIdx === i
                ? "bg-emerald-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">Cargando gastos...</p>
        </div>
      ) : (
        <>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total {months[selectedIdx].label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(total)}</p>
                </div>
                {diff !== null && (
                  <div className={`flex items-center gap-1 text-sm font-medium ${diff > 0 ? "text-red-500" : "text-emerald-500"}`}>
                    {diff > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {Math.abs(diff).toFixed(1)}% vs mes anterior
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {Object.keys(byStore).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Por tienda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(byStore).map(([name, { color, total: storeTotal }]) => (
                  <div key={name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className="font-medium text-gray-700">{name}</span>
                      </div>
                      <span className="text-gray-600">{formatCurrency(storeTotal)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(storeTotal / maxStore) * 100}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {purchases.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Compras del mes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {purchases.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{p.product.name}</p>
                      <p className="text-xs text-gray-400">{p.product.store.name} · {formatDate(p.purchaseDate)}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{formatCurrency(p.price)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {purchases.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">No hay gastos registrados este mes</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
