"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { GASOLINE_MERCHANTS } from "@/lib/gasoline.queries";
import { ChevronLeft, ChevronRight, Fuel, ListFilter } from "lucide-react";

interface GasolineTableProps {
    purchases: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    filteredTotalAmount: number;
}

export default function GasolineTable({
    purchases,
    total,
    page,
    pageSize,
    totalPages,
    filteredTotalAmount,
}: GasolineTableProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const todayStr = new Date().toISOString().split("T")[0];

    const currentDateFrom  = searchParams.get("dateFrom")  ?? "";
    const currentDateTo    = searchParams.get("dateTo")    ?? "";
    const currentMerchant  = searchParams.get("merchant")  ?? "";

    const hasActiveFilters = Boolean(currentDateFrom || currentDateTo || currentMerchant);
    
    // El total debe aparecer si hay comercio seleccionado (con fechas vacías o ambas completas), 
    // o si solo se buscan fechas (ambas completas).
    const isDateRangeComplete = Boolean(currentDateFrom && currentDateTo);
    const hasPartialDate = Boolean((currentDateFrom && !currentDateTo) || (!currentDateFrom && currentDateTo));
    const showTotal = currentMerchant ? !hasPartialDate : isDateRangeComplete;

    /**
     * Actualiza un param de la URL preservando `tab=gasoline` y demás filtros.
     * Resetea la paginación al cambiar cualquier filtro.
     */
    const setParam = useCallback(
        (key: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
            params.delete("page");
            router.push(`${pathname}?${params.toString()}`);
        },
        [router, pathname, searchParams]
    );

    /** Limpia todos los filtros de la tabla pero conserva tab=gasoline */
    const clearAll = useCallback(() => {
        const params = new URLSearchParams();
        const tab = searchParams.get("tab");
        if (tab) params.set("tab", tab);
        router.push(`${pathname}?${params.toString()}`);
    }, [router, pathname, searchParams]);

    function goToPage(newPage: number) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", newPage.toString());
        router.push(`${pathname}?${params.toString()}`);
    }

    const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const endItem   = Math.min(page * pageSize, total);

    // Páginas a mostrar en el paginador (máx 5 intermedias)
    function getPageNumbers() {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        const pages: (number | "...")[] = [];
        if (page <= 4) {
            pages.push(1, 2, 3, 4, 5, "...", totalPages);
        } else if (page >= totalPages - 3) {
            pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
            pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
        }
        return pages;
    }

    return (
        <div className="space-y-4">
            {/* ── Panel de Filtros ── */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ListFilter className="h-4 w-4 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Filtros del listado
                        </span>
                    </div>
                    {showTotal ? (
                        <div className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                            Total filtrado: ${filteredTotalAmount.toFixed(2)}
                        </div>
                    ) : (
                        <span className="text-[11px] text-gray-400 italic hidden sm:block">
                            Los totales de las tarjetas no se ven afectados por estos filtros
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap items-end gap-3">
                    {/* Desde */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-500">Desde</label>
                        <input
                            type="date"
                            value={currentDateFrom}
                            max={currentDateTo || todayStr}
                            onChange={(e) => setParam("dateFrom", e.target.value)}
                            className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    {/* Hasta */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-500">Hasta</label>
                        <input
                            type="date"
                            value={currentDateTo}
                            min={currentDateFrom || undefined}
                            max={todayStr}
                            onChange={(e) => setParam("dateTo", e.target.value)}
                            className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    {/* Separador */}
                    <div className="hidden h-9 w-px bg-gray-200 sm:block" />

                    {/* Comercio */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-500">Comercio</label>
                        <select
                            value={currentMerchant}
                            onChange={(e) => setParam("merchant", e.target.value)}
                            className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Todos</option>
                            {GASOLINE_MERCHANTS.map((m) => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>

                    {/* Limpiar */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearAll}
                            className="h-9 rounded-lg border border-gray-300 px-3 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                        >
                            Limpiar
                        </button>
                    )}
                </div>
            </div>

            {/* ── Tabla ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Comercio</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo Pago</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {purchases.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        <Fuel className="h-8 w-8 mx-auto text-gray-300 mb-3" />
                                        <p>No se encontraron compras de gasolina.</p>
                                        {hasActiveFilters && (
                                            <p className="text-xs text-gray-400 mt-1">Prueba limpiando los filtros.</p>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                purchases.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Intl.DateTimeFormat("es-ES", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            }).format(new Date(p.purchasedAt))}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {p.merchant}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                p.paymentType === "Credito"
                                                    ? "bg-purple-100 text-purple-800"
                                                    : "bg-emerald-100 text-emerald-800"
                                            }`}>
                                                {p.paymentType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                                            ${Number(p.amount).toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Paginador (siempre visible cuando hay resultados) ── */}
                {total > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 bg-white px-4 py-3 gap-3">
                        {/* Contador */}
                        <p className="text-sm text-gray-700 whitespace-nowrap">
                            Mostrando{" "}
                            <span className="font-medium">{startItem}</span>
                            {" "}–{" "}
                            <span className="font-medium">{endItem}</span>
                            {" "}de{" "}
                            <span className="font-medium">{total}</span>{" "}
                            {total === 1 ? "registro" : "registros"}
                        </p>

                        {/* Navegación de páginas */}
                        {totalPages > 1 && (
                            <nav className="flex items-center gap-1" aria-label="Paginación">
                                {/* Anterior */}
                                <button
                                    onClick={() => goToPage(page - 1)}
                                    disabled={page === 1}
                                    className="flex items-center justify-center h-8 w-8 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    aria-label="Página anterior"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>

                                {/* Números de página */}
                                {getPageNumbers().map((p, i) =>
                                    p === "..." ? (
                                        <span key={`ellipsis-${i}`} className="h-8 w-8 flex items-center justify-center text-gray-400 text-sm select-none">
                                            …
                                        </span>
                                    ) : (
                                        <button
                                            key={p}
                                            onClick={() => goToPage(p as number)}
                                            className={`h-8 w-8 flex items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                                                p === page
                                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                                            }`}
                                            aria-current={p === page ? "page" : undefined}
                                        >
                                            {p}
                                        </button>
                                    )
                                )}

                                {/* Siguiente */}
                                <button
                                    onClick={() => goToPage(page + 1)}
                                    disabled={page === totalPages}
                                    className="flex items-center justify-center h-8 w-8 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    aria-label="Página siguiente"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </nav>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
