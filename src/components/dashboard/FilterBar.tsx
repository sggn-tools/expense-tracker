/**
 * src/components/dashboard/FilterBar.tsx
 * Client Component — maneja los filtros del dashboard.
 *
 * Los filtros se almacenan en la URL como searchParams.
 * IMPORTANTE: el parámetro `tab` siempre se preserva al cambiar filtros,
 * ya que las tabs controlan las KPI cards y este componente solo
 * afecta al listado de transacciones.
 */
"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { ListFilter } from "lucide-react";

interface Card {
    id: string;
    alias: string | null;
    bankName: string;
    lastFour: string;
    cardType: string;
}

interface FilterBarProps {
    cards: Card[];
}

const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

export default function FilterBar({ cards }: FilterBarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Leer valores actuales de la URL
    const year    = searchParams.get("year")     ?? "";
    const month   = searchParams.get("month")    ?? "";
    const day     = searchParams.get("day")      ?? "";
    const cardId  = searchParams.get("cardId")   ?? "";
    const dateFrom = searchParams.get("dateFrom") ?? "";
    const dateTo   = searchParams.get("dateTo")   ?? "";

    /**
     * Actualiza un parámetro en la URL sin perder los demás.
     * Preserva siempre `tab` para no cambiar la pestaña activa.
     */
    const setParam = useCallback(
        (key: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
            // Resetear página al cambiar filtros
            params.delete("page");
            router.push(`${pathname}?${params.toString()}`);
        },
        [router, pathname, searchParams]
    );

    /**
     * Limpia todos los filtros manuales PERO conserva `tab`
     * para no perder la pestaña activa.
     */
    const clearAll = useCallback(() => {
        const params = new URLSearchParams();
        const tab = searchParams.get("tab");
        if (tab) params.set("tab", tab);
        router.push(`${pathname}?${params.toString()}`);
    }, [router, pathname, searchParams]);

    const hasActiveFilters = year || month || day || cardId || dateFrom || dateTo;

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
            {/* Encabezado con ícono y nota informativa */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ListFilter className="h-4 w-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Filtros del listado
                    </span>
                </div>
                <span className="text-[11px] text-gray-400 italic hidden sm:block">
                    Los totales de tarjetas no se ven afectados por estos filtros
                </span>
            </div>

            <div className="flex flex-wrap items-end gap-3">

                {/* Año */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">Año</label>
                    <select
                        value={year}
                        onChange={(e) => setParam("year", e.target.value)}
                        className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="">Todos</option>
                        {YEARS.map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>

                {/* Mes */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">Mes</label>
                    <select
                        value={month}
                        onChange={(e) => setParam("month", e.target.value)}
                        className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="">Todos</option>
                        {MONTHS.map((m, i) => (
                            <option key={m} value={i + 1}>{m}</option>
                        ))}
                    </select>
                </div>

                {/* Día */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">Día</label>
                    <input
                        type="number"
                        min={1}
                        max={31}
                        placeholder="1–31"
                        value={day}
                        onChange={(e) => setParam("day", e.target.value)}
                        className="h-9 w-20 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                {/* Separador visual */}
                <div className="hidden h-9 w-px bg-gray-200 sm:block" />

                {/* Rango de fechas */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">Desde</label>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setParam("dateFrom", e.target.value)}
                        className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">Hasta</label>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setParam("dateTo", e.target.value)}
                        className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                {/* Separador visual */}
                <div className="hidden h-9 w-px bg-gray-200 sm:block" />

                {/* Tarjeta */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">Tarjeta</label>
                    <select
                        value={cardId}
                        onChange={(e) => setParam("cardId", e.target.value)}
                        className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="">Todas</option>
                        {cards.map((card) => (
                            <option key={card.id} value={card.id}>
                                {card.alias ?? `${card.cardType} ···${card.lastFour}`}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Limpiar filtros */}
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
    );
}