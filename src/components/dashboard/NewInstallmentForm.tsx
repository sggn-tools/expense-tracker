/**
 * src/components/dashboard/NewInstallmentForm.tsx
 * Client Component — Formulario modal para registrar una nueva compra a plazo.
 */

"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Calendar, CreditCard, DollarSign, Tag, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

interface Card {
  id: string;
  alias: string | null;
  bankName: string;
  cardType: string;
  lastFour: string;
}

interface NewInstallmentFormProps {
  cards: Card[];
  onClose: () => void;
  onCreated?: () => void;
}

export default function NewInstallmentForm({
  cards,
  onClose,
  onCreated,
}: NewInstallmentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [cardId, setCardId] = useState(cards[0]?.id || "");
  const [merchant, setMerchant] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [totalMonths, setTotalMonths] = useState("12");
  const [purchasedAt, setPurchasedAt] = useState("");
  const [firstPaymentAt, setFirstPaymentAt] = useState("");
  const [notes, setNotes] = useState("");

  // Set default dates to today
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0] || "";
    setPurchasedAt(today);
    setFirstPaymentAt(today);
  }, []);

  // Calculate monthly installment preview in real-time
  const amountNum = parseFloat(totalAmount) || 0;
  const monthsNum = parseInt(totalMonths, 10) || 1;
  const monthlyPayment = amountNum > 0 && monthsNum > 0 ? (amountNum / monthsNum) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardId) {
      setError("Por favor, selecciona una tarjeta.");
      return;
    }
    if (!merchant.trim()) {
      setError("El nombre del comercio es obligatorio.");
      return;
    }
    if (amountNum <= 0) {
      setError("El monto total debe ser mayor que cero.");
      return;
    }
    if (monthsNum < 2 || monthsNum > 60) {
      setError("El número de meses debe estar entre 2 y 60.");
      return;
    }
    if (!purchasedAt) {
      setError("La fecha de compra es obligatoria.");
      return;
    }
    if (!firstPaymentAt) {
      setError("La fecha del primer pago es obligatoria.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/installments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId,
          merchant,
          totalAmount: amountNum,
          totalMonths: monthsNum,
          purchasedAt: new Date(purchasedAt + "T00:00:00.000Z").toISOString(),
          firstPaymentAt: new Date(firstPaymentAt + "T00:00:00.000Z").toISOString(),
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ? JSON.stringify(data.error) : "Error al registrar la compra");
      }

      router.refresh();
      if (onCreated) onCreated();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-all duration-300 transform scale-100 animate-scale-up border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Tag className="h-5 w-5 text-indigo-500" />
            Nueva Compra a Plazo
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-700 max-h-24 overflow-y-auto">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tarjeta */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-gray-400" />
              Tarjeta de Crédito
            </label>
            <select
              value={cardId}
              onChange={(e) => setCardId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
              required
            >
              <option value="" disabled>Selecciona una tarjeta</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.alias ?? `${c.bankName} ····${c.lastFour}`} ({c.cardType})
                </option>
              ))}
            </select>
          </div>

          {/* Comercio */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-gray-400" />
              Comercio
            </label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="Ej. Apple Store, Best Buy"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
              required
            />
          </div>

          {/* Monto y Plazo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                Monto Total
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                Plazo (Meses)
              </label>
              <input
                type="number"
                min="2"
                max="60"
                value={totalMonths}
                onChange={(e) => setTotalMonths(e.target.value)}
                placeholder="12"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Fecha Compra
              </label>
              <input
                type="date"
                value={purchasedAt}
                onChange={(e) => setPurchasedAt(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Primer Pago
              </label>
              <input
                type="date"
                value={firstPaymentAt}
                onChange={(e) => setFirstPaymentAt(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-gray-400" />
              Notas (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles sobre la compra..."
              rows={2}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all resize-none"
            />
          </div>

          {/* Preview Panel */}
          {monthlyPayment > 0 && (
            <div className="rounded-xl bg-indigo-50/50 border border-indigo-100/30 p-3.5 text-xs text-indigo-700 flex justify-between items-center">
              <div>
                <p className="font-semibold">Plan Estimado</p>
                <p className="text-[10px] text-indigo-500/80 mt-0.5">Monto de cuota mensual fija</p>
              </div>
              <p className="text-base font-bold">
                {monthsNum} x {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(monthlyPayment)}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Registrando...
                </>
              ) : (
                "Guardar Compra"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
