"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addGasolinePurchase } from "@/lib/gasoline.actions";
import { GASOLINE_MERCHANTS } from "@/lib/gasoline.queries";

export default function NewGasolinePage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    // Default to current date (YYYY-MM-DD)
    const today = new Date().toISOString().split("T")[0];

    async function handleSubmit(formData: FormData) {
        setError(null);
        startTransition(async () => {
            const result = await addGasolinePurchase(null, formData);
            if (result?.error) {
                setError(result.error);
            } else {
                router.push("/dashboard?tab=gasoline");
            }
        });
    }

    return (
        <div className="max-w-xl mx-auto space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Registrar Gasolina</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Ingresa los detalles de tu compra de combustible.
                </p>
            </div>

            <form action={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
                {error && (
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 font-medium">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Monto */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700" htmlFor="amount">
                            Monto ($) *
                        </label>
                        <input
                            type="number"
                            id="amount"
                            name="amount"
                            step="0.01"
                            min="0.01"
                            required
                            className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="0.00"
                        />
                    </div>

                    {/* Fecha */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700" htmlFor="purchasedAt">
                            Fecha *
                        </label>
                        <input
                            type="date"
                            id="purchasedAt"
                            name="purchasedAt"
                            defaultValue={today}
                            required
                            className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    {/* Comercio */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700" htmlFor="merchant">
                            Comercio *
                        </label>
                        <select
                            id="merchant"
                            name="merchant"
                            required
                            className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        >
                            <option value="">Selecciona un comercio</option>
                            {GASOLINE_MERCHANTS.map((m) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Tipo de Pago */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700" htmlFor="paymentType">
                            Tipo de Pago *
                        </label>
                        <select
                            id="paymentType"
                            name="paymentType"
                            required
                            className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        >
                            <option value="">Selecciona el tipo de pago</option>
                            <option value="Credito">Crédito</option>
                            <option value="Contado">Contado</option>
                        </select>
                    </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="px-6 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        {isPending ? "Guardando..." : "Guardar Registro"}
                    </button>
                </div>
            </form>
        </div>
    );
}
