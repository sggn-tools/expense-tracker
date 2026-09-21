/**
 * src/components/dashboard/InstallmentList.tsx
 * Client Component — Contenedor principal de compras a plazo.
 * Maneja el listado, barra de búsqueda o filtros simples, y abre los modales de detalle y creación.
 */

"use client";

import { useState } from "react";
import { Plus, Search, CalendarClock, CreditCard, ChevronRight, Inbox, HelpCircle } from "lucide-react";
import NewInstallmentForm from "./NewInstallmentForm";
import InstallmentDetailModal from "./InstallmentDetailModal";

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

interface Card {
  id: string;
  alias: string | null;
  bankName: string;
  cardType: string;
  lastFour: string;
}

interface InstallmentListProps {
  initialInstallments: InstallmentPurchase[];
  cards: Card[];
}

export default function InstallmentList({
  initialInstallments,
  cards,
}: InstallmentListProps) {
  const [installments, setInstallments] = useState<InstallmentPurchase[]>(initialInstallments);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<InstallmentPurchase | null>(null);

  // Sync state if initialInstallments changes
  if (initialInstallments !== installments && JSON.stringify(initialInstallments) !== JSON.stringify(installments)) {
    setInstallments(initialInstallments);
    // Also update selected purchase details to reflect changes (e.g. marking as paid)
    if (selectedPurchase) {
      const updated = initialInstallments.find((i) => i.id === selectedPurchase.id);
      if (updated) setSelectedPurchase(updated);
    }
  }

  const formatVal = (val: any): number => {
    if (typeof val === "number") return val;
    if (val && typeof val.toNumber === "function") return val.toNumber();
    return Number(val || 0);
  };

  const filtered = installments.filter((item) => {
    const merchantMatch = item.merchant.toLowerCase().includes(searchTerm.toLowerCase());
    const cardMatch = (item.card.alias || `${item.card.bankName} ${item.card.lastFour}`)
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return merchantMatch || cardMatch;
  });

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat("es-SV", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(date));
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(value);
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
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Compras a Plazo
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona y haz seguimiento a tus compras financiadas en cuotas.
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          Registrar Compra
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por comercio o tarjeta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50/50 placeholder-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Main List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="rounded-full bg-indigo-50 p-4 mb-4">
              <CalendarClock className="h-8 w-8 text-indigo-500" />
            </div>
            <p className="text-base font-bold text-gray-900">
              {searchTerm ? "Sin resultados" : "No tienes compras a plazo registradas"}
            </p>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">
              {searchTerm 
                ? "Prueba modificando tu término de búsqueda."
                : "Agrega tu primera compra financiada para planificar tus cuotas mensuales automáticamente."}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsFormOpen(true)}
                className="mt-5 inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Registrar mi primera compra
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Comercio</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Tarjeta</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Monto Total</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cuotas</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Progreso</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((item) => {
                  const totalAmt = formatVal(item.totalAmount);
                  const paidCount = item.payments.filter((p) => p.isPaid).length;
                  const percent = Math.round((paidCount / item.totalMonths) * 100);

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {item.merchant}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          Comprado el {formatDate(item.purchasedAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-gray-500">
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <CreditCard className="h-3.5 w-3.5 text-gray-400" />
                          {item.card.alias ?? `${item.card.bankName} ····${item.card.lastFour}`}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {formatCurrency(totalAmt, item.currency)}
                      </td>
                      <td className="px-6 py-4 text-gray-700 font-medium">
                        {paidCount} / {item.totalMonths}
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <div className="flex items-center gap-2 max-w-[120px]">
                          <div className="relative h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-500">{percent}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${statusColors[item.status]}`}>
                          {statusLabels[item.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedPurchase(item)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition-all"
                        >
                          Ver Detalle
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <NewInstallmentForm
          cards={cards}
          onClose={() => setIsFormOpen(false)}
        />
      )}

      {/* Detail Modal */}
      {selectedPurchase && (
        <InstallmentDetailModal
          purchase={selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
        />
      )}
    </div>
  );
}
