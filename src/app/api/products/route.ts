import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  if (!name || !storeId) {
    return NextResponse.json({ error: "Nombre y tienda son requeridos" }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      name,
      storeId,
      categoryId: categoryId || null,
      unit: unit || "unidad",
      estimatedDurationDays: estimatedDurationDays || 30,
      userId: session.user.id,
    },
    include: { store: true, category: true },
  });

  return NextResponse.json(product, { status: 201 });
}
