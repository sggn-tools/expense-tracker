/**
 * src/components/dashboard/TransactionTable.tsx
 * Server Component — tabla de transacciones con paginación.
 */

import Link from "next/link";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";

interface Transaction {
    id: string;
    amount: number | { toNumber: () => number };
    merchant: string;
    category: string | null;
    transactedAt: Date;
    card: {
        bankName: string;
        cardType: string;
        lastFour: string;
        alias: string | null;
    };
}

interface TransactionTableProps {
    transactions: Transaction[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    searchParams: Record<string, string>;
}

function formatCurrency(value: number | { toNumber: () => number }) {
    const num = typeof value === "number" ? value : value.toNumber();
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(num);
}

function formatDate(date: Date) {
    return new Intl.DateTimeFormat("es-SV", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(date));
}

const CATEGORY_COLORS: Record<string, string> = {
    Supermercado: "bg-green-100 text-green-700",
    Gasolina: "bg-orange-100 text-orange-700",
    Restaurante: "bg-red-100 text-red-700",
    Suscripción: "bg-purple-100 text-purple-700",
    Salud: "bg-blue-100 text-blue-700",
    Transporte: "bg-yellow-100 text-yellow-700",
    Hospedaje: "bg-indigo-100 text-indigo-700",
    Ropa: "bg-pink-100 text-pink-700",
    Otro: "bg-gray-100 text-gray-600",
};

function CategoryBadge({ category }: { category: string | null }) {
    const label = category ?? "Otro";
    const colors = CATEGORY_COLORS[label] ?? CATEGORY_COLORS["Otro"]!;
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors}`}>
            {label}
        </span>
    );
}

function buildPageUrl(
    searchParams: Record<string, string>,
    page: number
): string {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    return `/dashboard?${params.toString()}`;
}

export default function TransactionTable({
    transactions,
    total,
    page,
    pageSize,
    totalPages,
    searchParams,
}: TransactionTableProps) {
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);

    if (transactions.length === 0) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Inbox className="h-10 w-10 text-gray-300 mb-3" />
                    <p className="text-sm font-medium text-gray-500">Sin transacciones</p>
                    <p className="text-xs text-gray-400 mt-1">
                        Sincroniza tus correos o ajusta los filtros
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Tabla */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Fecha
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Comercio
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                                Categoría
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                                Tarjeta
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Monto
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                    {formatDate(tx.transactedAt)}
                                </td>
                                <td className="px-4 py-3 font-medium text-gray-900">
                                    {tx.merchant}
                                </td>
                                <td className="px-4 py-3 hidden sm:table-cell">
                                    <CategoryBadge category={tx.category} />
                                </td>
                                <td className="px-4 py-3 text-gray-500 hidden md:table-cell whitespace-nowrap">
                                    {tx.card.alias ?? `${tx.card.cardType} ···${tx.card.lastFour}`}
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                                    {formatCurrency(tx.amount)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                <p className="text-xs text-gray-500">
                    Mostrando <span className="font-medium">{start}–{end}</span> de{" "}
                    <span className="font-medium">{total}</span> transacciones
                </p>

                <div className="flex items-center gap-1">
                    {page > 1 ? (
                        <Link
                            href={buildPageUrl(searchParams, page - 1)}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                            Anterior
                        </Link>
                    ) : (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-300 cursor-not-allowed">
                            <ChevronLeft className="h-3.5 w-3.5" />
                            Anterior
                        </span>
                    )}

                    <span className="px-2 text-xs text-gray-500">
                        {page} / {totalPages}
                    </span>

                    {page < totalPages ? (
                        <Link
                            href={buildPageUrl(searchParams, page + 1)}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            Siguiente
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                    ) : (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-300 cursor-not-allowed">
                            Siguiente
                            <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}