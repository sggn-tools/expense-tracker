/**
 * src/app/dashboard/page.tsx
 *
 * Página principal del dashboard.
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { dashboardFiltersSchema } from "@/schemas/transaction";
import {
  getTransactions,
  getKpis,
  getTopCard,
  getUserCards,
  getCardSpending,
  getCurrentMonthFilters,
} from "@/lib/dashboard.queries";
import { getGasolineKpis, getGasolinePurchases } from "@/lib/gasoline.queries";
import KpiCards from "@/components/dashboard/KpiCards";
import FilterBar from "@/components/dashboard/FilterBar";
import TransactionTable from "@/components/dashboard/TransactionTable";
import SyncButton from "@/components/dashboard/SyncButton";
import GasolineTable from "@/components/dashboard/GasolineTable";

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

interface DashboardPageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const rawParams = await searchParams;

  // ── Pestaña activa (default: "current") ──────────────────────────
  const activeTab = (rawParams.tab === "gasoline" ? "gasoline" : rawParams.tab === "all" ? "all" : "current") as "current" | "all" | "gasoline";

  const page = Math.max(1, parseInt(rawParams.page ?? "1", 10));

  let kpis = { totalAmount: 0, totalCount: 0, dailyAverage: 0 };
  let topCard = null;
  let txData = { transactions: [] as any[], total: 0, page: 1, pageSize: 20, totalPages: 0 };
  let cards = [] as any[];
  let cardSpending = [] as any[];
  
  let gasolineKpis = undefined;
  let gasolineData = { purchases: [] as any[], total: 0, page: 1, pageSize: 20, totalPages: 0, filteredTotalAmount: 0 };

  if (activeTab === "gasoline") {
    // ── Queries para Gasolina ──────────────────────────────────────────
    const gasYear = rawParams.year ? parseInt(rawParams.year, 10) : undefined;
    const gasMonth = rawParams.month ? parseInt(rawParams.month, 10) : undefined;
    const gasMerchant = rawParams.merchant;
    const gasDateFrom = rawParams.dateFrom ? new Date(`${rawParams.dateFrom}T00:00:00`) : undefined;
    const gasDateTo   = rawParams.dateTo   ? new Date(`${rawParams.dateTo}T23:59:59`)   : undefined;
    const gasFilters = { year: gasYear, month: gasMonth, merchant: gasMerchant, dateFrom: gasDateFrom, dateTo: gasDateTo };

    [gasolineKpis, gasolineData] = await Promise.all([
      getGasolineKpis(userId),
      getGasolinePurchases(userId, gasFilters, page)
    ]);
  } else {
    // ── Queries para Dashboard General ───────────────────────────────
    const tabFilters = activeTab === "current" ? getCurrentMonthFilters() : {};
    
    // Excluimos `tab` del parse
    const { tab: _tab, ...txRawParams } = rawParams;
    const txFiltersResult = dashboardFiltersSchema.safeParse(txRawParams);
    const txFilters = txFiltersResult.success ? txFiltersResult.data : {};

    [kpis, topCard, txData, cards, cardSpending] = await Promise.all([
      getKpis(userId, tabFilters),
      getTopCard(userId, tabFilters),
      getTransactions(userId, txFilters, page),
      getUserCards(userId),
      getCardSpending(userId, tabFilters),
    ]);
  }

  // ── Etiqueta descriptiva del período activo ──────────────────────
  const now = new Date();
  const periodLabel =
    activeTab === "current"
      ? `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`
      : activeTab === "all"
      ? "todo el período"
      : "Gasolina";

  return (
    <div className="space-y-6">
      {/* ── Encabezado ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Resumen de gastos desde tus correos bancarios
          </p>
        </div>
        <SyncButton />
      </div>

      {/* ── KPIs con tabs ── */}
      <KpiCards
        totalAmount={kpis.totalAmount}
        totalCount={kpis.totalCount}
        dailyAverage={kpis.dailyAverage}
        topCard={topCard}
        cardSpending={cardSpending}
        activeTab={activeTab}
        periodLabel={periodLabel}
        currentSearchParams={rawParams}
        gasolineKpis={gasolineKpis}
      />

      {activeTab === "gasoline" ? (
        <GasolineTable
          purchases={gasolineData.purchases}
          total={gasolineData.total}
          page={gasolineData.page}
          pageSize={gasolineData.pageSize}
          totalPages={gasolineData.totalPages}
          filteredTotalAmount={gasolineData.filteredTotalAmount}
        />
      ) : (
        <>
          {/* ── Filtros (solo afectan la tabla) ── */}
          <Suspense fallback={null}>
            <FilterBar cards={cards} />
          </Suspense>

          {/* ── Tabla de transacciones ── */}
          <TransactionTable
            transactions={txData.transactions}
            total={txData.total}
            page={txData.page}
            pageSize={txData.pageSize}
            totalPages={txData.totalPages}
            searchParams={rawParams}
          />
        </>
      )}
    </div>
  );
}