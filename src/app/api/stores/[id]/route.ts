import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await context.params;
  const { name, color } = await req.json();

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }

  const store = await prisma.store.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });

  if (!store) {
    return NextResponse.json({ error: "La tienda no existe o no te pertenece" }, { status: 404 });
  }

  const updatedStore = await prisma.store.update({
    where: { id: store.id },
    data: {
      name: name.trim(),
      color: typeof color === "string" && color.trim() ? color.trim() : "#6366f1",
    },
  });

  return NextResponse.json(updatedStore);
}

export async function DELETE(_req: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await context.params;

  const store = await prisma.store.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });

  if (!store) {
    return NextResponse.json({ error: "La tienda no existe o no te pertenece" }, { status: 404 });
  }

  const productCount = await prisma.product.count({
    where: { storeId: store.id, userId: session.user.id },
  });

  if (productCount > 0) {
    return NextResponse.json(
      { error: "No puedes eliminar una tienda con productos asociados" },
      { status: 409 }
    );
  }

  await prisma.store.delete({ where: { id: store.id } });

  return NextResponse.json({ ok: true });
}
