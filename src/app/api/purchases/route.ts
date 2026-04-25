import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays } from "@/lib/utils";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const where: Record<string, unknown> = { userId: session.user.id };

  if (month && year) {
    const start = new Date(parseInt(year), parseInt(month) - 1, 1);
    const end = new Date(parseInt(year), parseInt(month), 1);
    where.purchaseDate = { gte: start, lt: end };
  }

  const purchases = await prisma.purchase.findMany({
    where,
    include: { product: { include: { store: true } } },
    orderBy: { purchaseDate: "desc" },
  });

  return NextResponse.json(purchases);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { productId, purchaseDate, price, quantity, estimatedDurationDays } = await req.json();

  if (typeof productId !== "string" || !productId.trim()) {
    return NextResponse.json({ error: "Producto es requerido" }, { status: 400 });
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, userId: session.user.id },
    select: { id: true },
  });

  if (!product) {
    return NextResponse.json({ error: "El producto no existe o no te pertenece" }, { status: 403 });
  }

  const pDate = purchaseDate ? new Date(purchaseDate) : new Date();
  if (Number.isNaN(pDate.getTime())) {
    return NextResponse.json({ error: "Fecha de compra inválida" }, { status: 400 });
  }

  const requestedQuantity = Number(quantity);
  if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
    return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });
  }

  const requestedDuration = Number(estimatedDurationDays);
  const safeDuration = Number.isInteger(requestedDuration) && requestedDuration > 0 ? requestedDuration : 30;

  const requestedPrice = Number(price);
  if (Number.isNaN(requestedPrice) || requestedPrice < 0) {
    return NextResponse.json({ error: "Precio inválido" }, { status: 400 });
  }

  const projectedRunOutDate = addDays(pDate, safeDuration);

  const purchase = await prisma.purchase.create({
    data: {
      productId: product.id,
      purchaseDate: pDate,
      price: requestedPrice,
      quantity: requestedQuantity,
      estimatedDurationDays: safeDuration,
      projectedRunOutDate,
      userId: session.user.id,
    },
    include: { product: { include: { store: true } } },
  });

  return NextResponse.json(purchase, { status: 201 });
}
