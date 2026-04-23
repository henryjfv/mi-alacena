import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const stores = await prisma.store.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(stores);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { name, color } = await req.json();

  if (!name) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

  const store = await prisma.store.create({
    data: { name, color: color || "#6366f1", userId: session.user.id },
  });

  return NextResponse.json(store, { status: 201 });
}
