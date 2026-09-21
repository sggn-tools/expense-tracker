/**
 * src/app/api/installments/route.ts
 *
 * Endpoint para gestionar compras a plazo (listar y crear).
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createInstallmentSchema } from "@/schemas/installment";
import { createInstallment, getInstallments } from "@/lib/installments.queries";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const installments = await getInstallments(session.user.id);
    return NextResponse.json(installments);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno del servidor";
    console.error("[GET /api/installments] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createInstallmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const newInstallment = await createInstallment(session.user.id, parsed.data);
    return NextResponse.json(newInstallment, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno del servidor";
    console.error("[POST /api/installments] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
