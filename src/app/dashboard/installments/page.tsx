/**
 * src/app/dashboard/installments/page.tsx
 *
 * Página de Compras a Plazo (Server Component).
 * Carga las compras a plazo y tarjetas en paralelo, serializa campos decimal/fecha,
 * y delega el renderizado interactivo al componente cliente.
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getInstallments } from "@/lib/installments.queries";
import { getUserCards } from "@/lib/dashboard.queries";
import InstallmentList from "@/components/dashboard/InstallmentList";

export default async function InstallmentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  // Cargar compras a plazo y tarjetas del usuario
  const [installments, cards] = await Promise.all([
    getInstallments(userId),
    getUserCards(userId),
  ]);

  // Serializar campos complejos (Decimal de Prisma y fechas) para evitar
  // errores de serialización al cruzar el límite Server -> Client Component.
  const serializedInstallments = installments.map((inst) => ({
    id: inst.id,
    merchant: inst.merchant,
    totalAmount: Number(inst.totalAmount),
    currency: inst.currency,
    totalMonths: inst.totalMonths,
    purchasedAt: inst.purchasedAt.toISOString(),
    firstPaymentAt: inst.firstPaymentAt.toISOString(),
    notes: inst.notes,
    status: inst.status,
    card: {
      id: inst.card.id,
      bankName: inst.card.bankName,
      cardType: inst.card.cardType,
      lastFour: inst.card.lastFour,
      alias: inst.card.alias,
    },
    payments: inst.payments.map((p) => ({
      id: p.id,
      monthNumber: p.monthNumber,
      dueDate: p.dueDate.toISOString(),
      amount: Number(p.amount),
      isPaid: p.isPaid,
      paidAt: p.paidAt ? p.paidAt.toISOString() : null,
    })),
  }));

  const serializedCards = cards.map((c) => ({
    id: c.id,
    alias: c.alias,
    bankName: c.bankName,
    cardType: c.cardType,
    lastFour: c.lastFour,
  }));

  return (
    <div className="container mx-auto py-2">
      <InstallmentList
        initialInstallments={serializedInstallments}
        cards={serializedCards}
      />
    </div>
  );
}
