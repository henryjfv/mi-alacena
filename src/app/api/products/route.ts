import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function normalizeDuration(value: unknown) {
  const duration = Number(value);
  return Number.isInteger(duration) && duration > 0 ? duration : 30;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const products = await prisma.product.findMany({
    where: { userId: session.user.id },
    include: { store: true, category: true },
    orderBy: [{ store: { name: "asc" } }, { name: "asc" }],
  });

  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { name, storeId, categoryId, unit, estimatedDurationDays } = await req.json();

  if (typeof name !== "string" || typeof storeId !== "string" || !name.trim() || !storeId.trim()) {
    return NextResponse.json({ error: "Nombre y tienda son requeridos" }, { status: 400 });
  }

  const store = await prisma.store.findFirst({
    where: { id: storeId, userId: session.user.id },
    select: { id: true },
  });

  if (!store) {
    return NextResponse.json({ error: "La tienda no existe o no te pertenece" }, { status: 403 });
  }

  const safeDuration = normalizeDuration(estimatedDurationDays);

  const product = await prisma.product.create({
    data: {
      name: name.trim(),
      storeId: store.id,
      categoryId: categoryId || null,
      unit: typeof unit === "string" && unit.trim() ? unit.trim() : "unidad",
      estimatedDurationDays: safeDuration,
      userId: session.user.id,
    },
    include: { store: true, category: true },
  });

  return NextResponse.json(product, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, name, storeId, categoryId, unit, estimatedDurationDays } = await req.json();

  if (typeof id !== "string" || !id.trim()) {
    return NextResponse.json({ error: "Producto requerido" }, { status: 400 });
  }

  if (typeof name !== "string" || typeof storeId !== "string" || !name.trim() || !storeId.trim()) {
    return NextResponse.json({ error: "Nombre y tienda son requeridos" }, { status: 400 });
  }

  const product = await prisma.product.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });

  if (!product) {
    return NextResponse.json({ error: "El producto no existe o no te pertenece" }, { status: 404 });
  }

  const store = await prisma.store.findFirst({
    where: { id: storeId, userId: session.user.id },
    select: { id: true },
  });

  if (!store) {
    return NextResponse.json({ error: "La tienda no existe o no te pertenece" }, { status: 403 });
  }

  const updatedProduct = await prisma.product.update({
    where: { id: product.id },
    data: {
      name: name.trim(),
      storeId: store.id,
      categoryId: categoryId || null,
      unit: typeof unit === "string" && unit.trim() ? unit.trim() : "unidad",
      estimatedDurationDays: normalizeDuration(estimatedDurationDays),
    },
    include: { store: true, category: true },
  });

  return NextResponse.json(updatedProduct);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Producto requerido" }, { status: 400 });
  }

  const product = await prisma.product.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });

  if (!product) {
    return NextResponse.json({ error: "El producto no existe o no te pertenece" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.cartItem.deleteMany({ where: { productId: product.id, userId: session.user.id } }),
    prisma.purchase.deleteMany({ where: { productId: product.id, userId: session.user.id } }),
    prisma.product.delete({ where: { id: product.id } }),
  ]);

  return NextResponse.json({ ok: true });
}
