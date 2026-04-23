import { AlertTriangle, CalendarDays, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { daysFromNow, formatDate } from "@/lib/utils";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

type CalendarItem = {
  id: string;
  name: string;
  store: string;
  storeColor: string;
  projectedRunOutDate: Date;
};

function groupByWeek(items: CalendarItem[]) {
  const groups: { label: string; items: CalendarItem[] }[] = [
    { label: "Esta semana", items: [] },
    { label: "En 2 semanas", items: [] },
    { label: "Este mes", items: [] },
    { label: "Más adelante", items: [] },
  ];

  items.forEach((item) => {
    const days = daysFromNow(item.projectedRunOutDate);
    if (days <= 7) groups[0].items.push(item);
    else if (days <= 14) groups[1].items.push(item);
    else if (days <= 30) groups[2].items.push(item);
    else groups[3].items.push(item);
  });

  return groups.filter((g) => g.items.length > 0);
}

export default async function CalendarioPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const products = await prisma.product.findMany({
    where: {
      userId: session.user.id,
      purchases: { some: {} },
    },
    include: {
      store: true,
      purchases: {
        orderBy: { purchaseDate: "desc" },
        take: 1,
      },
    },
  });

  const items: CalendarItem[] = products
    .filter((p) => p.purchases[0] && !p.purchases[0].actualRunOutDate)
    .map((p) => ({
      id: p.id,
      name: p.name,
      store: p.store.name,
      storeColor: p.store.color,
      projectedRunOutDate: p.purchases[0].projectedRunOutDate,
    }))
    .sort((a, b) => new Date(a.projectedRunOutDate).getTime() - new Date(b.projectedRunOutDate).getTime());

  const groups = groupByWeek(items);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
          <p className="text-sm text-gray-500 mt-0.5">Cuándo se acaba cada cosa</p>
        </div>
        <CalendarDays className="h-5 w-5 text-gray-400" />
      </div>

      {groups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
          <CalendarDays className="h-12 w-12 text-gray-200" />
          <p className="text-gray-500 font-medium">No hay productos en tu inventario</p>
          <p className="text-sm text-gray-400">Registra una compra para ver las fechas aquí</p>
          <Link href="/checkout">
            <Button size="sm">Registrar compra</Button>
          </Link>
        </div>
      )}

      {groups.map(({ label, items: groupItems }) => (
        <div key={label} className="space-y-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</h2>
          <Card>
            <CardContent className="pt-4 space-y-1">
              {groupItems.map((item) => {
                const days = daysFromNow(item.projectedRunOutDate);
                const isUrgent = days <= 7;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      {isUrgent
                        ? <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                        : <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                      }
                      <div>
                        <p className="text-sm font-medium text-gray-800">{item.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className="inline-block h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: item.storeColor }}
                          />
                          <span className="text-xs text-gray-400">{item.store}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-xs text-gray-400">{formatDate(item.projectedRunOutDate)}</p>
                        <Badge variant={isUrgent ? "warning" : "secondary"} className="mt-0.5">
                          {days}d
                        </Badge>
                      </div>
                      {isUrgent && (
                        <Link href="/checkout">
                          <Button size="sm" className="h-7 text-xs px-2">Comprar</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
