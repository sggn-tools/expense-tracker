/**
 * src/app/api/installments/[id]/payments/[paymentId]/route.ts
 *
 * Endpoint para marcar una cuota específica como pagada.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { markPaymentPaid } from "@/lib/installments.queries";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { paymentId } = await params;
    const updatedPayment = await markPaymentPaid(paymentId, session.user.id);
    return NextResponse.json(updatedPayment);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno del servidor";
    console.error("[PATCH /api/installments/[id]/payments/[paymentId]] Error:", message);

    if (
      err instanceof Error &&
      (err.message.includes("ya ha sido realizado") || err.message.includes("no existe"))
    ) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
