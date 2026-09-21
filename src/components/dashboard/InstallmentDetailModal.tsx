/**
 * src/components/dashboard/InstallmentDetailModal.tsx
 * Client Component — Modal para ver el detalle de una compra a plazo y marcar cuotas como pagadas.
 */

"use client";

import { useState } from "react";
import { X, Check, Loader2, Calendar, CreditCard, DollarSign, Tag, Info } from "lucide-react";
import { useRouter } from "next/navigation";

interface Payment {
  id: string;
  monthNumber: number;
  dueDate: string | Date;
  amount: number | { toNumber: () => number } | any;
  isPaid: boolean;
  paidAt: string | Date | null;
}

interface InstallmentPurchase {
  id: string;
  merchant: string;
  totalAmount: number | { toNumber: () => number } | any;
  currency: string;
  totalMonths: number;
  purchasedAt: string | Date;
  firstPaymentAt: string | Date;
  notes: string | null;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  card: {
    id: string;
    bankName: string;
    cardType: string;
    lastFour: string;
    alias: string | null;
  };
  payments: Payment[];
}

interface InstallmentDetailModalProps {
  purchase: InstallmentPurchase;
  onClose: () => void;
  onUpdate?: () => void;
}

export default function InstallmentDetailModal({
  purchase,
  onClose,
  onUpdate,
}: InstallmentDetailModalProps) {
  const router = useRouter();
  const [markingPaymentId, setMarkingPaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatVal = (val: any): number => {
    if (typeof val === "number") return val;
    if (val && typeof val.toNumber === "function") return val.toNumber();
    return Number(val || 0);
  };

  const totalAmount = formatVal(purchase.totalAmount);
  
  // Calculate paid and remaining months / amounts
  const paidPayments = purchase.payments.filter((p) => p.isPaid);
  const monthsPaid = paidPayments.length;
  const monthsRemaining = purchase.totalMonths - monthsPaid;

  const amountPaid = paidPayments.reduce((sum, p) => sum + formatVal(p.amount), 0);
  const amountRemaining = totalAmount - amountPaid;

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat("es-SV", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(date));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: purchase.currency || "USD",
    }).format(value);
  };

  const handleMarkAsPaid = async (paymentId: string) => {
    setMarkingPaymentId(paymentId);
    setError(null);
    try {
      const res = await fetch(`/api/installments/${purchase.id}/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al actualizar el pago");
      }

      router.refresh();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      setError(err.message || "Error de red al actualizar");
    } finally {
      setMarkingPaymentId(null);
    }
  };

  const statusColors = {
    ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    COMPLETED: "bg-indigo-50 text-indigo-700 border-indigo-200",
    CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
  };

  const statusLabels = {
    ACTIVE: "Activa",
    COMPLETED: "Completada",
    CANCELLED: "Cancelada",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl transition-all duration-300 transform scale-100 animate-scale-up border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 pb-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColors[purchase.status]}`}>
                {statusLabels[purchase.status]}
              </span>
              <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                {purchase.card.alias ?? `${purchase.card.bankName} ····${purchase.card.lastFour}`}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Tag className="h-5 w-5 text-gray-400" />
              {purchase.merchant}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">Monto Total</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="rounded-xl bg-indigo-50/50 p-4 border border-indigo-100/30">
            <p className="text-xs text-indigo-600/80 font-medium">Total Pagado</p>
            <p className="text-lg font-bold text-indigo-700 mt-1">{formatCurrency(amountPaid)}</p>
            <p className="text-[10px] text-indigo-500 mt-0.5">{monthsPaid} de {purchase.totalMonths} meses</p>
          </div>
          <div className="rounded-xl bg-emerald-50/50 p-4 border border-emerald-100/30">
            <p className="text-xs text-emerald-600/80 font-medium">Total Restante</p>
            <p className="text-lg font-bold text-emerald-700 mt-1">{formatCurrency(amountRemaining)}</p>
            <p className="text-[10px] text-emerald-500 mt-0.5">{monthsRemaining} meses restantes</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">Fecha Compra</p>
            <p className="text-sm font-semibold text-gray-900 mt-2">{formatDate(purchase.purchasedAt)}</p>
          </div>
        </div>

        {/* Notes (if any) */}
        {purchase.notes && (
          <div className="mb-6 rounded-xl bg-amber-50/50 border border-amber-100/50 p-4 flex gap-2.5">
            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-800">Notas</p>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">{purchase.notes}</p>
            </div>
          </div>
        )}

        {/* Payments Schedule */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            Calendario de Pagos
          </h3>
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    <th className="px-4 py-2.5 font-bold text-gray-500 uppercase tracking-wider">Cuota</th>
                    <th className="px-4 py-2.5 font-bold text-gray-500 uppercase tracking-wider">Vencimiento</th>
                    <th className="px-4 py-2.5 font-bold text-gray-500 uppercase tracking-wider">Monto</th>
                    <th className="px-4 py-2.5 font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase tracking-wider">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {purchase.payments.map((p) => {
                    const paymentAmount = formatVal(p.amount);
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          {p.monthNumber} de {purchase.totalMonths}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {formatDate(p.dueDate)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          {formatCurrency(paymentAmount)}
                        </td>
                        <td className="px-4 py-3">
                          {p.isPaid ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              <Check className="h-2.5 w-2.5" />
                              Pagada
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {p.isPaid ? (
                            <span className="text-[10px] text-gray-400 italic">
                              Pagada el {formatDate(p.paidAt!)}
                            </span>
                          ) : (
                            <button
                              onClick={() => handleMarkAsPaid(p.id)}
                              disabled={markingPaymentId !== null}
                              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 shadow-sm hover:bg-gray-50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                            >
                              {markingPaymentId === p.id ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin mr-1 text-indigo-600" />
                                  Procesando...
                                </>
                              ) : (
                                "Marcar pagada"
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
