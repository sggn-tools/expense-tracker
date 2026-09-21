/**
 * src/lib/dashboard.queries.ts
 *
 * Queries Prisma para el dashboard.
 * Todas las funciones reciben userId para asegurar
 * que cada usuario solo ve sus propios datos.
 */

import { prisma } from "@/lib/prisma";
import { type DashboardFilters } from "@/schemas/transaction";
import { Prisma } from "@prisma/client";

// ── Helpers ───────────────────────────────────────────────────────

/**
 * Retorna los filtros correspondientes al mes actual.
 * Usado por la pestaña "Mes Actual" para calcular KPIs y tarjetas
 * de forma independiente a los filtros manuales del usuario.
 */
export function getCurrentMonthFilters(): DashboardFilters {
    const now = new Date();
    return {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
    };
}

/**
 * Construye el bloque WHERE de Prisma según los filtros activos.
 * Soporta: año, mes, día, rango de fechas y tarjeta específica.
 *
 * FIX: Si solo se proporciona mes (sin año) se usa el año actual.
 * Si solo se proporciona día (sin año/mes) se usa el mes y año actuales.
 */
function buildWhereClause(
    userId: string,
    filters: DashboardFilters
): Prisma.TransactionWhereInput {
    const { dateFrom, dateTo, cardId } = filters;
    let { year, month, day } = filters;

    // Filtro por fecha
    let dateFilter: Prisma.TransactionWhereInput["transactedAt"] = undefined;

    const now = new Date();

    if (dateFrom || dateTo) {
        // Rango explícito tiene prioridad sobre año/mes/día
        dateFilter = {
            ...(dateFrom && { gte: dateFrom }),
            ...(dateTo && { lte: dateTo }),
        };
    } else if (year || month || day) {
        // Si hay mes o día pero no año, usar año actual
        if (!year && (month || day)) year = now.getFullYear();
        // Si hay día pero no mes, usar mes actual
        if (!month && day) month = now.getMonth() + 1;

        const start = new Date(year!, (month ?? 1) - 1, day ?? 1);
        let end: Date;

        if (day) {
            // Día específico → desde 00:00 hasta 23:59:59
            end = new Date(year!, (month ?? 1) - 1, day, 23, 59, 59, 999);
        } else if (month) {
            // Mes específico → desde día 1 hasta último día del mes
            end = new Date(year!, month, 0, 23, 59, 59, 999);
        } else {
            // Solo año → todo el año
            end = new Date(year!, 11, 31, 23, 59, 59, 999);
        }

        dateFilter = { gte: start, lte: end };
    }

    return {
        card: {
            userId,
            ...(cardId && { id: cardId }),
        },
        ...(dateFilter && { transactedAt: dateFilter }),
    };
}

// ── Queries públicas ──────────────────────────────────────────────

/** Transacciones paginadas con datos de tarjeta incluidos */
export async function getTransactions(
    userId: string,
    filters: DashboardFilters,
    page = 1,
    pageSize = 20
) {
    const where = buildWhereClause(userId, filters);

    const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
            where,
            include: {
                card: {
                    select: { bankName: true, cardType: true, lastFour: true, alias: true },
                },
            },
            orderBy: { transactedAt: "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.transaction.count({ where }),
    ]);

    return { transactions, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

/** KPIs: total gastado, número de transacciones, promedio diario */
export async function getKpis(userId: string, filters: DashboardFilters) {
    const where = buildWhereClause(userId, filters);

    const result = await prisma.transaction.aggregate({
        where,
        _sum: { amount: true },
        _count: { id: true },
        _avg: { amount: true },
    });

    const totalAmount = Number(result._sum.amount ?? 0);
    const totalCount = result._count.id;

    // Calcular días únicos para el promedio diario
    const transactions = await prisma.transaction.findMany({
        where,
        select: { transactedAt: true },
    });

    const uniqueDays = new Set(
        transactions.map((t) => t.transactedAt.toISOString().slice(0, 10))
    ).size;

    const dailyAverage = uniqueDays > 0 ? totalAmount / uniqueDays : 0;

    return {
        totalAmount,
        totalCount,
        dailyAverage,
    };
}

/** Tarjeta con mayor gasto en el período filtrado */
export async function getTopCard(userId: string, filters: DashboardFilters) {
    const where = buildWhereClause(userId, filters);

    const result = await prisma.transaction.groupBy({
        by: ["cardId"],
        where,
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: 1,
    });

    if (!result[0]) return null;

    const card = await prisma.card.findUnique({
        where: { id: result[0].cardId },
        select: { alias: true, bankName: true, cardType: true, lastFour: true },
    });

    return {
        card,
        amount: Number(result[0]._sum.amount ?? 0),
    };
}

/** Lista de tarjetas del usuario para el selector de filtros */
export async function getUserCards(userId: string) {
    return prisma.card.findMany({
        where: { userId, isActive: true },
        select: { id: true, alias: true, bankName: true, lastFour: true, cardType: true },
        orderBy: { bankName: "asc" },
    });
}

/** Obtiene el gasto total por cada tarjeta activa del usuario */
export async function getCardSpending(userId: string, filters: DashboardFilters) {
    const cards = await getUserCards(userId);
    const where = buildWhereClause(userId, filters);

    const spending = await Promise.all(
        cards.map(async (card) => {
            const result = await prisma.transaction.aggregate({
                where: {
                    ...where,
                    cardId: card.id,
                },
                _sum: { amount: true },
                _count: { id: true },
            });

            return {
                card,
                amount: Number(result._sum.amount ?? 0),
                count: result._count.id,
            };
        })
    );

    return spending;
}

/** Obtiene el gasto total agrupado por categoría */
export async function getCategorySpending(userId: string, filters: DashboardFilters) {
    const where = buildWhereClause(userId, filters);

    const result = await prisma.transaction.groupBy({
        by: ["category"],
        where,
        _sum: { amount: true },
        _count: { id: true },
        orderBy: { _sum: { amount: "desc" } },
    });

    return result.map((r) => ({
        category: r.category ?? "Otro",
        amount: Number(r._sum.amount ?? 0),
        count: r._count.id,
    }));
}

/** Obtiene la tendencia de gastos históricos agrupados por fecha (YYYY-MM-DD) */
export async function getSpendingOverTime(userId: string, filters: DashboardFilters) {
    const where = buildWhereClause(userId, filters);

    const transactions = await prisma.transaction.findMany({
        where,
        select: {
            amount: true,
            transactedAt: true,
        },
        orderBy: { transactedAt: "asc" },
    });

    const grouped: Record<string, number> = {};

    transactions.forEach((t) => {
        const dateStr = t.transactedAt.toISOString().slice(0, 10);
        grouped[dateStr] = (grouped[dateStr] ?? 0) + Number(t.amount);
    });

    return Object.entries(grouped).map(([date, amount]) => ({
        date,
        amount,
    }));
}