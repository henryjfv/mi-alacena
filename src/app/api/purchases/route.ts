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

  if (!productId || !price) {
    return NextResponse.json({ error: "Producto y precio son requeridos" }, { status: 400 });
  }

  const pDate = purchaseDate ? new Date(purchaseDate) : new Date();
  const projectedRunOutDate = addDays(pDate, estimatedDurationDays || 30);

  const purchase = await prisma.purchase.create({
    data: {
      productId,
      purchaseDate: pDate,
      price,
      quantity: quantity || 1,
      estimatedDurationDays: estimatedDurationDays || 30,
      projectedRunOutDate,
      userId: session.user.id,
    },
    include: { product: { include: { store: true } } },
  });

  return NextResponse.json(purchase, { status: 201 });
}
