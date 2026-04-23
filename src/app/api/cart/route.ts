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
  if (!productId) return NextResponse.json({ error: "Producto requerido" }, { status: 400 });

  const existing = await prisma.cartItem.findFirst({
    where: { userId: session.user.id, productId },
  });

  if (existing) {
    const updated = await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + (quantity || 1) },
      include: { product: { include: { store: true } } },
    });
    return NextResponse.json(updated);
  }

  const item = await prisma.cartItem.create({
    data: { productId, quantity: quantity || 1, userId: session.user.id },
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
