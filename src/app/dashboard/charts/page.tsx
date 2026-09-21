/**
 * src/app/dashboard/charts/page.tsx
 *
 * Página de Gráficos e Analíticas.
 * Server Component: obtiene datos en paralelo basados en los searchParams (URL)
 * y delega el renderizado interactivo a componentes cliente dedicados.
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { dashboardFiltersSchema } from "@/schemas/transaction";
import {
    getCategorySpending,
    getSpendingOverTime,
    getCardSpending,
    getUserCards,
} from "@/lib/dashboard.queries";
import FilterBar from "@/components/dashboard/FilterBar";
import AnalyticsCharts from "@/components/dashboard/AnalyticsCharts";

interface ChartsPageProps {
    searchParams: Promise<Record<string, string>>;
}

export default async function ChartsPage({ searchParams }: ChartsPageProps) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const userId = session.user.id;
    const rawParams = await searchParams;

    // Validar filtros desde la URL con Zod
    const filtersResult = dashboardFiltersSchema.safeParse(rawParams);
    const filters = filtersResult.success ? filtersResult.data : {};

    // Cargar todas las consultas agrupadas para gráficos en paralelo
    const [categorySpending, spendingOverTime, cardSpending, cards] = await Promise.all([
        getCategorySpending(userId, filters),
        getSpendingOverTime(userId, filters),
        getCardSpending(userId, filters),
        getUserCards(userId),
    ]);

    return (
        <div className="space-y-6">
            {/* ── Encabezado ── */}
            <div>
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Analíticas y Gráficos</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    Visualiza detalladamente la distribución e histórico de tus gastos
                </p>
            </div>

            {/* ── Filtros Compartidos ── */}
            <Suspense fallback={<div className="h-20 rounded-xl bg-gray-100 animate-pulse" />}>
                <FilterBar cards={cards} />
            </Suspense>

            {/* ── Dashboard de Gráficos ── */}
            <AnalyticsCharts
                categorySpending={categorySpending}
                spendingOverTime={spendingOverTime}
                cardSpending={cardSpending}
            />
        </div>
    );
}
