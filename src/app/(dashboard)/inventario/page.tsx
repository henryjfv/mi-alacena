import { ShoppingBag, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { daysFromNow, formatDate } from "@/lib/utils";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

function getProductStatus(projectedRunOutDate: Date, actualRunOutDate: Date | null) {
  if (actualRunOutDate) return "agotado";
  const days = daysFromNow(projectedRunOutDate);
  if (days <= 0) return "agotado";
  if (days <= 7) return "pronto";
  return "disponible";
}

export default async function InventarioPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const stores = await prisma.store.findMany({
    where: { userId: session.user.id },
    include: {
      products: {
        where: { purchases: { some: {} } },
        include: {
          purchases: {
            orderBy: { purchaseDate: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const inventory = stores
    .filter((store) => store.products.length > 0)
    .map((store) => ({
      storeName: store.name,
      storeColor: store.color,
      products: store.products.map((product) => ({
        id: product.id,
        name: product.name,
        projectedRunOutDate: product.purchases[0].projectedRunOutDate,
        actualRunOutDate: product.purchases[0].actualRunOutDate,
      })),
    }));

  const totals = { disponible: 0, pronto: 0, agotado: 0 };
  inventory.forEach((store) =>
    store.products.forEach((p) => {
      totals[getProductStatus(p.projectedRunOutDate, p.actualRunOutDate)]++;
    })
  );

  if (inventory.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
            <p className="text-sm text-gray-500 mt-0.5">Lo que tienes en casa hoy</p>
          </div>
          <Link href="/checkout">
            <Button size="sm">+ Registrar compra</Button>
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
          <ShoppingBag className="h-12 w-12 text-gray-200" />
          <p className="text-gray-500 font-medium">Tu inventario está vacío</p>
          <p className="text-sm text-gray-400">Registra una compra para ver tus productos aquí</p>
          <Link href="/checkout">
            <Button size="sm">Registrar primera compra</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          <p className="text-sm text-gray-500 mt-0.5">Lo que tienes en casa hoy</p>
        </div>
        <Link href="/checkout">
          <Button size="sm">+ Registrar compra</Button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center p-4">
          <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">{totals.disponible}</p>
          <p className="text-xs text-gray-500">Disponibles</p>
        </Card>
        <Card className="text-center p-4">
          <AlertTriangle className="h-5 w-5 text-amber-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">{totals.pronto}</p>
          <p className="text-xs text-gray-500">Por acabarse</p>
        </Card>
        <Card className="text-center p-4">
          <XCircle className="h-5 w-5 text-red-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">{totals.agotado}</p>
          <p className="text-xs text-gray-500">Agotados</p>
        </Card>
      </div>

      {inventory.map((store) => (
        <Card key={store.storeName}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: store.storeColor }}
              />
              {store.storeName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {store.products.map((product) => {
              const status = getProductStatus(product.projectedRunOutDate, product.actualRunOutDate);
              const days = daysFromNow(product.projectedRunOutDate);
              return (
                <div
                  key={product.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {status === "disponible" && <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />}
                    {status === "pronto" && <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />}
                    {status === "agotado" && <XCircle className="h-4 w-4 text-red-400 shrink-0" />}
                    <span className={`text-sm font-medium ${status === "agotado" ? "text-gray-400 line-through" : "text-gray-800"}`}>
                      {product.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {status === "disponible" && (
                      <Badge variant="default">{days}d restantes</Badge>
                    )}
                    {status === "pronto" && (
                      <Badge variant="warning">Se acaba en {days}d</Badge>
                    )}
                    {status === "agotado" && (
                      <Badge variant="destructive">Agotado</Badge>
                    )}
                    {status === "agotado" && (
                      <Link href="/checkout">
                        <Button size="sm" variant="outline" className="text-xs h-7 px-2">
                          Comprar
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <ShoppingBag className="h-3.5 w-3.5" />
        <span>Los productos agotados aparecen automáticamente en tu carrito</span>
      </div>
    </div>
  );
}
