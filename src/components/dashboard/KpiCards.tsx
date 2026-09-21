/**
 * src/components/dashboard/KpiCards.tsx
 * Server Component — recibe los datos ya calculados como props.
 *
 * Incluye tabs "Mes Actual" / "Consolidado" / "Gasolina"
 */

import Link from "next/link";
import { TrendingUp, CreditCard, BarChart3, Calendar, Fuel } from "lucide-react";

interface CardSpendingItem {
    card: {
        id: string;
        alias: string | null;
        bankName: string;
        cardType: string;
        lastFour: string;
    };
    amount: number;
    count: number;
}

interface KpiCardsProps {
    totalAmount: number;
    totalCount: number;
    dailyAverage: number;
    topCard: {
        card: {
            alias: string | null;
            bankName: string;
            cardType: string;
            lastFour: string;
        } | null;
        amount: number;
    } | null;
    cardSpending: CardSpendingItem[];
    activeTab: "current" | "all" | "gasoline";
    periodLabel: string;
    currentSearchParams: Record<string, string>;
    gasolineKpis?: {
        merchantTotals: { merchant: string; amount: number }[];
        currentMonthTotal: number;
        allTimeTotal: number;
    };
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
    }).format(value);
}

interface KpiCardProps {
    title: string;
    value: string;
    subtitle?: string;
    icon: React.ReactNode;
    color: "blue" | "emerald" | "amber" | "violet" | "rose" | "indigo" | "yellow" | "gray";
}

const colorMap = {
    blue:    { bg: "bg-blue-50/50",    icon: "bg-blue-100/80 text-blue-600",    value: "text-blue-700",    border: "border-blue-100" },
    emerald: { bg: "bg-emerald-50/50", icon: "bg-emerald-100/80 text-emerald-600", value: "text-emerald-700", border: "border-emerald-100" },
    amber:   { bg: "bg-amber-50/50",   icon: "bg-amber-100/80 text-amber-600",  value: "text-amber-700",   border: "border-amber-100" },
    violet:  { bg: "bg-violet-50/50",  icon: "bg-violet-100/80 text-violet-600", value: "text-violet-700",  border: "border-violet-100" },
    rose:    { bg: "bg-rose-50/50",    icon: "bg-rose-100/80 text-rose-600",    value: "text-rose-700",    border: "border-rose-100" },
    indigo:  { bg: "bg-indigo-50/50",  icon: "bg-indigo-100/80 text-indigo-600", value: "text-indigo-700",  border: "border-indigo-100" },
    yellow:  { bg: "bg-yellow-50/50",  icon: "bg-yellow-100/80 text-yellow-600", value: "text-yellow-700",  border: "border-yellow-100" },
    gray:    { bg: "bg-gray-50/50",    icon: "bg-gray-100/80 text-gray-600",    value: "text-gray-700",    border: "border-gray-100" },
};

function KpiCard({ title, value, subtitle, icon, color }: KpiCardProps) {
    const c = colorMap[color] || colorMap.gray;
    return (
        <div className={`rounded-xl border ${c.border} ${c.bg} p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01] bg-white`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</p>
                    <p className={`mt-2 text-3xl font-bold tracking-tight ${c.value}`}>{value}</p>
                    {subtitle && (
                        <p className="mt-1 text-xs text-gray-500 font-medium">{subtitle}</p>
                    )}
                </div>
                <div className={`rounded-xl p-3 ${c.icon}`}>{icon}</div>
            </div>
        </div>
    );
}

/** Construye la URL de la pestaña conservando los demás searchParams */
function buildTabUrl(
    currentSearchParams: Record<string, string>,
    tab: "current" | "all" | "gasoline"
): string {
    const params = new URLSearchParams(currentSearchParams);
    params.set("tab", tab);
    params.delete("page"); // reset paginación al cambiar pestaña
    return `/dashboard?${params.toString()}`;
}

export default function KpiCards({
    totalAmount,
    totalCount,
    dailyAverage,
    topCard,
    cardSpending = [],
    activeTab,
    periodLabel,
    currentSearchParams,
    gasolineKpis,
}: KpiCardsProps) {
    const tabCurrentHref = buildTabUrl(currentSearchParams, "current");
    const tabAllHref     = buildTabUrl(currentSearchParams, "all");
    const tabGasolineHref = buildTabUrl(currentSearchParams, "gasoline");

    return (
        <div className="space-y-6">
            {/* ── Tabs "Mes Actual" / "Consolidado" / "Gasolina" ── */}
            <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1 w-fit">
                <Link
                    href={tabCurrentHref}
                    id="tab-current"
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                        activeTab === "current"
                            ? "bg-white text-blue-700 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                    📅 Mes Actual
                </Link>
                <Link
                    href={tabAllHref}
                    id="tab-all"
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                        activeTab === "all"
                            ? "bg-white text-blue-700 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                    📊 Consolidado
                </Link>
                <Link
                    href={tabGasolineHref}
                    id="tab-gasoline"
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                        activeTab === "gasoline"
                            ? "bg-white text-blue-700 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                    ⛽ Gasolina
                </Link>
            </div>

            {/* ── Etiqueta de período ── */}
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest -mt-3">
                Mostrando: <span className="text-blue-600 font-bold capitalize">{activeTab === "gasoline" ? "Gasolina (Mes Actual e Histórico)" : periodLabel}</span>
            </p>

            {activeTab === "gasoline" && gasolineKpis ? (
                <>
                    {/* Tarjetas de Gasolina: 5 por comercio, 2 totales */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* 5 Tarjetas por comercio (Mes Actual) */}
                        {gasolineKpis.merchantTotals.map((mt) => {
                            let color: KpiCardProps["color"] = "gray";
                            if (mt.merchant === "SHELL") color = "yellow";
                            if (mt.merchant === "TEXACO") color = "rose";
                            if (mt.merchant === "UNO") color = "blue";
                            if (mt.merchant === "PUMA") color = "emerald";
                            if (mt.merchant === "TEXAS GAS") color = "indigo";

                            return (
                                <KpiCard
                                    key={mt.merchant}
                                    title={`⛽ ${mt.merchant}`}
                                    value={formatCurrency(mt.amount)}
                                    subtitle="Mes actual"
                                    icon={<Fuel className="h-6 w-6" />}
                                    color={color}
                                />
                            );
                        })}

                        {/* Totales */}
                        <KpiCard
                            title="Total Todos Comercios"
                            value={formatCurrency(gasolineKpis.currentMonthTotal)}
                            subtitle="Mes actual"
                            icon={<BarChart3 className="h-6 w-6" />}
                            color="violet"
                        />
                        <KpiCard
                            title="Histórico Total"
                            value={formatCurrency(gasolineKpis.allTimeTotal)}
                            subtitle="Todos los meses"
                            icon={<Calendar className="h-6 w-6" />}
                            color="gray"
                        />
                    </div>
                </>
            ) : (
                <>
                    {/* ── Métricas Generales ── */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <KpiCard
                            title="Total Gastado"
                            value={formatCurrency(totalAmount)}
                            subtitle={`Acumulado — ${periodLabel}`}
                            icon={<TrendingUp className="h-6 w-6" />}
                            color="blue"
                        />
                        <KpiCard
                            title="Transacciones"
                            value={totalCount.toString()}
                            subtitle="Registradas desde emails"
                            icon={<BarChart3 className="h-6 w-6" />}
                            color="emerald"
                        />
                        <KpiCard
                            title="Promedio Diario"
                            value={formatCurrency(dailyAverage)}
                            subtitle="Por día con consumos"
                            icon={<Calendar className="h-6 w-6" />}
                            color="amber"
                        />
                    </div>

                    {/* ── Desglose por Tarjetas — SIEMPRE VISIBLE ── */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                            Mis Tarjetas &amp; Bancos
                        </h3>

                        {cardSpending.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-gray-500 bg-white">
                                No hay movimientos en este período.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {cardSpending.map(({ card, amount, count }) => {
                                    const isAgricola = /agricola|agrícola/i.test(card.bankName);
                                    const isSiman    = /siman/i.test(card.bankName);

                                    const cardTheme = isAgricola
                                        ? { gradient: "from-blue-600 to-indigo-700",  badge: "bg-blue-100 text-blue-800" }
                                        : isSiman
                                        ? { gradient: "from-rose-500 to-red-600",    badge: "bg-rose-100 text-rose-800" }
                                        : { gradient: "from-violet-600 to-purple-700", badge: "bg-purple-100 text-purple-800" };

                                    const cardLabel = card.alias ?? `${card.cardType} ···${card.lastFour}`;

                                    return (
                                        <div
                                            key={card.id}
                                            className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01] flex flex-col justify-between min-h-[140px]"
                                        >
                                            {/* Fondo decorativo */}
                                            <div className={`absolute -right-16 -top-16 h-36 w-36 rounded-full bg-gradient-to-br ${cardTheme.gradient} opacity-10 blur-xl`} />

                                            <div className="flex items-start justify-between z-10">
                                                <div>
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${cardTheme.badge} mb-2`}>
                                                        {card.bankName}
                                                    </span>
                                                    <h4 className="text-sm font-semibold text-gray-800 tracking-tight">
                                                        {cardLabel}
                                                    </h4>
                                                    <p className="text-xs text-gray-400 font-medium mt-0.5">
                                                        {count} {count === 1 ? "transacción" : "transacciones"}
                                                    </p>
                                                </div>
                                                <CreditCard className="h-6 w-6 text-gray-400" />
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-baseline justify-between z-10">
                                                <span className="text-xs font-medium text-gray-400">Total gastado:</span>
                                                <span className="text-xl font-bold tracking-tight text-gray-900">
                                                    {formatCurrency(amount)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}