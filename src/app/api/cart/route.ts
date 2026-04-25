import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const items = await prisma.cartItem.findMany({
    where: { userId: session.user.id },
    include: { product: { include: { store: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { productId, quantity } = await req.json();
  if (typeof productId !== "string" || !productId.trim()) {
    return NextResponse.json({ error: "Producto requerido" }, { status: 400 });
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, userId: session.user.id },
    select: { id: true },
  });

  if (!product) {
    return NextResponse.json({ error: "El producto no existe o no te pertenece" }, { status: 403 });
  }

  const requestedQuantity = Number(quantity);
  if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
    return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });
  }

  const existing = await prisma.cartItem.findFirst({
    where: { userId: session.user.id, productId: product.id },
  });

  if (existing) {
    const updated = await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + requestedQuantity },
      include: { product: { include: { store: true } } },
    });
    return NextResponse.json(updated);
  }

  const item = await prisma.cartItem.create({
    data: { productId: product.id, quantity: requestedQuantity, userId: session.user.id },
    include: { product: { include: { store: true } } },
  });

  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  await prisma.cartItem.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
