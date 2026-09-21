/**
 * src/components/dashboard/AnalyticsCharts.tsx
 * Client Component — Gráficos estadísticos interactivos de gastos en SVG puro.
 * Compatible al 100% con React 19 y Next.js App Router (zero-dependency).
 */
"use client";

import React, { useState, useMemo } from "react";
import { CreditCard, Inbox, PieChart, TrendingUp, DollarSign } from "lucide-react";

// ── Interfaces ───────────────────────────────────────────────────

interface CategorySpending {
    category: string;
    amount: number;
    count: number;
}

interface SpendingOverTime {
    date: string;
    amount: number;
}

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

interface AnalyticsChartsProps {
    categorySpending: CategorySpending[];
    spendingOverTime: SpendingOverTime[];
    cardSpending: CardSpendingItem[];
}

// ── Temas por Categoría (Consistencia de colores) ──────────────────

const CATEGORY_THEMES: Record<string, { stroke: string; bg: string; text: string; fill: string }> = {
    Supermercado: { stroke: "#10b981", bg: "bg-emerald-50", text: "text-emerald-700", fill: "fill-emerald-500" },
    Gasolina: { stroke: "#f97316", bg: "bg-orange-50", text: "text-orange-700", fill: "fill-orange-500" },
    Restaurante: { stroke: "#ef4444", bg: "bg-red-50", text: "text-red-700", fill: "fill-red-500" },
    Suscripción: { stroke: "#8b5cf6", bg: "bg-violet-50", text: "text-violet-700", fill: "fill-violet-500" },
    Salud: { stroke: "#3b82f6", bg: "bg-blue-50", text: "text-blue-700", fill: "fill-blue-500" },
    Transporte: { stroke: "#eab308", bg: "bg-yellow-50", text: "text-yellow-700", fill: "fill-yellow-500" },
    Hospedaje: { stroke: "#6366f1", bg: "bg-indigo-50", text: "text-indigo-700", fill: "fill-indigo-500" },
    Ropa: { stroke: "#ec4899", bg: "bg-pink-50", text: "text-pink-700", fill: "fill-pink-500" },
    Otro: { stroke: "#6b7280", bg: "bg-gray-50", text: "text-gray-700", fill: "fill-gray-500" },
};

const DEFAULT_THEME = { stroke: "#3b82f6", bg: "bg-blue-50", text: "text-blue-700", fill: "fill-blue-500" };

function getCategoryTheme(cat: string) {
    return CATEGORY_THEMES[cat] ?? DEFAULT_THEME;
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(value);
}

function formatDateFriendly(dateStr: string) {
    const date = new Date(dateStr + "T00:00:00");
    return new Intl.DateTimeFormat("es-SV", {
        day: "2-digit",
        month: "short",
    }).format(date);
}

// ── Helpers Matemáticos para SVG Arc (Donut Segment) ────────────────

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
    };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
        "M", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
}

// ── Componente Principal ──────────────────────────────────────────

export default function AnalyticsCharts({
    categorySpending = [],
    spendingOverTime = [],
    cardSpending = [],
}: AnalyticsChartsProps) {
    const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);
    const [hoveredCategoryIndex, setHoveredCategoryIndex] = useState<number | null>(null);
    const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);

    // Calcular montos totales
    const totalSpent = useMemo(() => {
        return categorySpending.reduce((acc, curr) => acc + curr.amount, 0);
    }, [categorySpending]);

    // 1. Cálculos para Gráfico de Tendencia Histórica (Área SVG)
    const trendData = useMemo(() => {
        if (spendingOverTime.length === 0) {
            return {
                points: [],
                maxAmount: 10,
            };
        }
        const maxVal = Math.max(...spendingOverTime.map((d) => d.amount), 10);
        return {
            points: spendingOverTime,
            maxAmount: maxVal,
        };
    }, [spendingOverTime]);

    // 2. Cálculos para Dona SVG (Categorías)
    const donutData = useMemo(() => {
        if (categorySpending.length === 0) return [];
        let currentAngle = 0;
        return categorySpending.map((item, index) => {
            const percentage = totalSpent > 0 ? (item.amount / totalSpent) * 100 : 0;
            const angleSize = (item.amount / (totalSpent || 1)) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angleSize;
            currentAngle = endAngle;

            return {
                ...item,
                percentage,
                startAngle,
                endAngle,
                index,
            };
        });
    }, [categorySpending, totalSpent]);

    // 3. Max card amount para barras horizontales
    const maxCardAmount = useMemo(() => {
        if (cardSpending.length === 0) return 1;
        return Math.max(...cardSpending.map((c) => c.amount), 1);
    }, [cardSpending]);

    // Caso de Datos Vacíos
    if (categorySpending.length === 0 && spendingOverTime.length === 0) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white p-16 shadow-sm text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-50 text-gray-400 mb-4">
                    <Inbox className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">Sin datos analíticos</h3>
                <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
                    No encontramos gastos registrados en el período o con los filtros seleccionados.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* ── 1. GRÁFICO HISTÓRICO (TENDENCIA) ── */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-3 flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900 tracking-tight">Tendencia de Gastos</h3>
                                <p className="text-xs text-gray-500">Historial diario acumulado</p>
                            </div>
                        </div>
                        {hoveredTrendIndex !== null && spendingOverTime[hoveredTrendIndex] && (
                            <div className="animate-fade-in bg-slate-900 text-white rounded-lg px-3 py-1 text-xs font-semibold shadow flex items-center gap-1.5 transition-all">
                                <span className="text-gray-300">{formatDateFriendly(spendingOverTime[hoveredTrendIndex].date)}:</span>
                                <span className="text-emerald-400 font-bold">{formatCurrency(spendingOverTime[hoveredTrendIndex].amount)}</span>
                            </div>
                        )}
                    </div>

                    {spendingOverTime.length < 2 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-center text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-100">
                            <TrendingUp className="h-8 w-8 text-gray-300 mb-2" />
                            <p className="text-xs">Se necesitan al menos 2 días de actividad para trazar la tendencia.</p>
                        </div>
                    ) : (
                        <div className="relative w-full h-64 mt-4">
                            <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                                <defs>
                                    {/* Gradiente lineal para el área bajo la curva */}
                                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.00" />
                                    </linearGradient>
                                </defs>

                                {/* Líneas de cuadrícula horizontales */}
                                <line x1="0" y1="50" x2="500" y2="50" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                                <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                                <line x1="0" y1="150" x2="500" y2="150" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />

                                {(() => {
                                    const points = spendingOverTime;
                                    const maxVal = trendData.maxAmount;
                                    const widthStep = 500 / (points.length - 1);

                                    // Mapear puntos a coordenadas SVG
                                    const coords = points.map((p, i) => {
                                        const x = i * widthStep;
                                        // Dejar margen de 20px arriba (180 de 200 de altura máx)
                                        const y = 180 - (p.amount / maxVal) * 150;
                                        return { x, y };
                                    });

                                    // Generar path de línea
                                    const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");

                                    // Generar path de área cerrada
                                    const areaPath = `${linePath} L ${coords[coords.length - 1]!.x} 180 L ${coords[0]!.x} 180 Z`;

                                    return (
                                        <>
                                            {/* Relleno con gradiente */}
                                            <path d={areaPath} fill="url(#areaGrad)" className="transition-all duration-500" />

                                            {/* Línea principal */}
                                            <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-500" />

                                            {/* Zonas de hover transparentes y puntos destacados */}
                                            {coords.map((c, i) => (
                                                <g key={i} onMouseEnter={() => setHoveredTrendIndex(i)} onMouseLeave={() => setHoveredTrendIndex(null)} className="cursor-pointer">
                                                    {/* Punto visible en hover */}
                                                    <circle
                                                        cx={c.x}
                                                        cy={c.y}
                                                        r={hoveredTrendIndex === i ? 6 : 3.5}
                                                        fill={hoveredTrendIndex === i ? "#2563eb" : "#3b82f6"}
                                                        stroke="white"
                                                        strokeWidth={hoveredTrendIndex === i ? 2.5 : 1.5}
                                                        className="transition-all duration-200"
                                                    />

                                                    {/* Rectángulo invisible ancho para facilitar hover en móviles/pantallas táctiles */}
                                                    <rect
                                                        x={c.x - widthStep / 2}
                                                        y={0}
                                                        width={widthStep}
                                                        height={200}
                                                        fill="transparent"
                                                    />
                                                </g>
                                            ))}
                                        </>
                                    );
                                })()}
                            </svg>
                        </div>
                    )}
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-400 font-semibold uppercase tracking-wider border-t border-gray-100 pt-4 mt-2">
                    <span>{spendingOverTime[0]?.date ? formatDateFriendly(spendingOverTime[0].date) : ""}</span>
                    <span>Progreso del período</span>
                    <span>{spendingOverTime[spendingOverTime.length - 1]?.date ? formatDateFriendly(spendingOverTime[spendingOverTime.length - 1]!.date) : ""}</span>
                </div>
            </div>

            {/* ── 2. GRÁFICO POR CATEGORÍA (DONUT) ── */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between min-h-[360px]">
                <div className="flex items-center gap-2 mb-4">
                    <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                        <PieChart className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-900 tracking-tight">Gastos por Categoría</h3>
                        <p className="text-xs text-gray-500">Distribución de consumos</p>
                    </div>
                </div>

                {/* Donut Area */}
                <div className="flex flex-col items-center justify-center my-auto">
                    <div className="relative h-44 w-44">
                        <svg className="w-full h-full" viewBox="0 0 200 200">
                            {categorySpending.length === 0 ? (
                                <circle cx="100" cy="100" r="70" fill="none" stroke="#f1f5f9" strokeWidth="20" />
                            ) : (
                                donutData.map((seg) => {
                                    const theme = getCategoryTheme(seg.category);
                                    const isHovered = hoveredCategoryIndex === seg.index;

                                    // Si hay un solo elemento, hacer el círculo completo directamente
                                    if (seg.percentage >= 99.9) {
                                        return (
                                            <circle
                                                key={seg.category}
                                                cx="100"
                                                cy="100"
                                                r="70"
                                                fill="none"
                                                stroke={theme.stroke}
                                                strokeWidth={isHovered ? 26 : 20}
                                                className="transition-all duration-300 cursor-pointer"
                                                onMouseEnter={() => setHoveredCategoryIndex(seg.index)}
                                                onMouseLeave={() => setHoveredCategoryIndex(null)}
                                            />
                                        );
                                    }

                                    // Para múltiples segmentos
                                    return (
                                        <path
                                            key={seg.category}
                                            d={describeArc(100, 100, 70, seg.startAngle, seg.endAngle)}
                                            fill="none"
                                            stroke={theme.stroke}
                                            strokeWidth={isHovered ? 26 : 20}
                                            strokeLinecap="round"
                                            className="transition-all duration-300 cursor-pointer origin-center"
                                            onMouseEnter={() => setHoveredCategoryIndex(seg.index)}
                                            onMouseLeave={() => setHoveredCategoryIndex(null)}
                                        />
                                    );
                                })
                            )}
                        </svg>

                        {/* Texto central de la Dona */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                            {hoveredCategoryIndex !== null && donutData[hoveredCategoryIndex] ? (
                                <div className="animate-fade-in px-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                                        {donutData[hoveredCategoryIndex].category}
                                    </p>
                                    <p className="text-lg font-extrabold text-gray-900 mt-0.5 tracking-tight">
                                        {donutData[hoveredCategoryIndex].percentage.toFixed(1)}%
                                    </p>
                                    <p className="text-[11px] font-bold text-emerald-600">
                                        {formatCurrency(donutData[hoveredCategoryIndex].amount)}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                                        Total Gastos
                                    </p>
                                    <p className="text-xl font-extrabold text-gray-950 mt-1 tracking-tight">
                                        {formatCurrency(totalSpent)}
                                    </p>
                                    <p className="text-[9px] font-medium text-gray-500 mt-0.5">
                                        {categorySpending.length} Categorías
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="text-center text-[10px] text-gray-400 font-semibold uppercase tracking-wider border-t border-gray-100 pt-3">
                    Pasa el cursor por los segmentos para más detalle
                </div>
            </div>

            {/* ── 3. LEYENDA Y DETALLE DE CATEGORÍAS ── */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between min-h-[360px] lg:col-span-2">
                <div>
                    <h3 className="text-base font-bold text-gray-900 tracking-tight mb-4">
                        Desglose de Gastos
                    </h3>
                    <div className="divide-y divide-gray-100 max-h-[250px] overflow-y-auto pr-1">
                        {donutData.map((item) => {
                            const theme = getCategoryTheme(item.category);
                            const isHovered = hoveredCategoryIndex === item.index;

                            return (
                                <div
                                    key={item.category}
                                    className={`flex items-center justify-between py-3 transition-colors rounded-xl px-2.5 -mx-2.5 ${
                                        isHovered ? "bg-gray-50/80" : ""
                                    }`}
                                    onMouseEnter={() => setHoveredCategoryIndex(item.index)}
                                    onMouseLeave={() => setHoveredCategoryIndex(null)}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Círculo indicador */}
                                        <div
                                            className="h-3 w-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: theme.stroke }}
                                        />
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800 tracking-tight">{item.category}</p>
                                            <p className="text-xs text-gray-400">
                                                {item.count} {item.count === 1 ? "gasto" : "gastos"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-900">{formatCurrency(item.amount)}</p>
                                        <p className="text-xs text-gray-400 font-semibold">{item.percentage.toFixed(1)}%</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider border-t border-gray-100 pt-3">
                    Consumos ordenados de mayor a menor monto
                </div>
            </div>

            {/* ── 4. GRÁFICO POR TARJETA / BANCO (BARRAS HORIZONTALES) ── */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-3">
                <div className="flex items-center gap-2 mb-6">
                    <div className="rounded-lg bg-violet-50 p-2 text-violet-600">
                        <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-900 tracking-tight">Consumo por Tarjetas</h3>
                        <p className="text-xs text-gray-500">Comparativa de gastos entre bancos activos</p>
                    </div>
                </div>

                <div className="space-y-5">
                    {cardSpending.map(({ card, amount, count }, index) => {
                        const isHovered = hoveredCardIndex === index;
                        const percentOfMax = maxCardAmount > 0 ? (amount / maxCardAmount) * 100 : 0;
                        const percentOfTotal = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;

                        // Gradiente basado en banco
                        const isAgricola = /agricola|agrícola/i.test(card.bankName);
                        const isSiman = /siman/i.test(card.bankName);
                        const barTheme = isAgricola
                            ? { barBg: "bg-gradient-to-r from-blue-500 to-indigo-600", text: "text-blue-700" }
                            : isSiman
                            ? { barBg: "bg-gradient-to-r from-rose-500 to-red-600", text: "text-rose-700" }
                            : { barBg: "bg-gradient-to-r from-violet-500 to-purple-600", text: "text-violet-700" };

                        const cardLabel = card.alias ?? `${card.cardType} ···${card.lastFour}`;

                        return (
                            <div
                                key={card.id}
                                className={`space-y-2 rounded-xl p-3 -m-3 transition-colors ${
                                    isHovered ? "bg-gray-50/60" : ""
                                }`}
                                onMouseEnter={() => setHoveredCardIndex(index)}
                                onMouseLeave={() => setHoveredCardIndex(null)}
                            >
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-800 tracking-tight">{card.bankName}</span>
                                        <span className="text-xs text-gray-400">({cardLabel})</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-gray-900">{formatCurrency(amount)}</span>
                                        <span className="text-xs text-gray-400 ml-2 font-medium">({percentOfTotal.toFixed(1)}%)</span>
                                    </div>
                                </div>

                                {/* Barra de Progreso animada en SVG / Tailwind */}
                                <div className="relative w-full h-5 bg-gray-100 rounded-full overflow-hidden shadow-inner flex items-center">
                                    <div
                                        className={`h-full ${barTheme.barBg} rounded-full transition-all duration-700 ease-out`}
                                        style={{ width: `${percentOfMax}%` }}
                                    />
                                    {isHovered && (
                                        <div className="absolute inset-0 flex items-center justify-end pr-3 animate-fade-in text-[10px] font-bold text-gray-600">
                                            {count} {count === 1 ? "transacción" : "transacciones"}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
