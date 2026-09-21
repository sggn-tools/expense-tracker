/**
 * src/lib/gasoline.queries.ts
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const GASOLINE_MERCHANTS = [
    "SHELL",
    "TEXACO",
    "UNO",
    "PUMA",
    "TEXAS GAS",
] as const;

export type GasolineMerchant = typeof GASOLINE_MERCHANTS[number];

export interface GasolineFilters {
    year?: number;
    month?: number;
    merchant?: string;
    dateFrom?: Date;
    dateTo?: Date;
}

function buildGasolineWhere(
    userId: string,
    filters: GasolineFilters
): Prisma.GasolinePurchaseWhereInput {
    let { year, month, merchant, dateFrom, dateTo } = filters;
    const now = new Date();

    let dateFilter: Prisma.GasolinePurchaseWhereInput["purchasedAt"] = undefined;

    if (dateFrom || dateTo) {
        // Rango explícito tiene prioridad sobre año/mes
        dateFilter = {
            ...(dateFrom && { gte: dateFrom }),
            ...(dateTo && { lte: dateTo }),
        };
    } else if (year || month) {
        if (!year && month) year = now.getFullYear();

        let start: Date;
        let end: Date;

        if (month) {
            start = new Date(year!, month - 1, 1);
            end = new Date(year!, month, 0, 23, 59, 59, 999);
        } else {
            start = new Date(year!, 0, 1);
            end = new Date(year!, 11, 31, 23, 59, 59, 999);
        }

        dateFilter = { gte: start, lte: end };
    }

    return {
        userId,
        ...(merchant && { merchant }),
        ...(dateFilter && { purchasedAt: dateFilter }),
    };
}

export async function getGasolinePurchases(
    userId: string,
    filters: GasolineFilters,
    page = 1,
    pageSize = 20
) {
    const where = buildGasolineWhere(userId, filters);

    const [purchasesRaw, total, aggregateResult] = await Promise.all([
        prisma.gasolinePurchase.findMany({
            where,
            orderBy: { purchasedAt: "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.gasolinePurchase.count({ where }),
        prisma.gasolinePurchase.aggregate({
            where,
            _sum: { amount: true },
        }),
    ]);

    const purchases = purchasesRaw.map((p) => ({
        ...p,
        amount: Number(p.amount),
    }));

    const filteredTotalAmount = Number(aggregateResult._sum.amount ?? 0);

    return { 
        purchases, 
        total, 
        page, 
        pageSize, 
        totalPages: Math.ceil(total / pageSize),
        filteredTotalAmount
    };
}

export async function getGasolineKpis(userId: string) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
    const endOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    // Totals per merchant (current month)
    const merchantTotalsResult = await prisma.gasolinePurchase.groupBy({
        by: ["merchant"],
        where: {
            userId,
            purchasedAt: {
                gte: startOfCurrentMonth,
                lte: endOfCurrentMonth,
            },
        },
        _sum: { amount: true },
    });

    const merchantTotals = GASOLINE_MERCHANTS.map((m) => {
        const found = merchantTotalsResult.find((r) => r.merchant === m);
        return {
            merchant: m,
            amount: Number(found?._sum.amount ?? 0),
        };
    });

    // Total all merchants (current month)
    const currentMonthTotalResult = await prisma.gasolinePurchase.aggregate({
        where: {
            userId,
            purchasedAt: {
                gte: startOfCurrentMonth,
                lte: endOfCurrentMonth,
            },
        },
        _sum: { amount: true },
    });
    const currentMonthTotal = Number(currentMonthTotalResult._sum.amount ?? 0);

    // Total all time
    const allTimeTotalResult = await prisma.gasolinePurchase.aggregate({
        where: { userId },
        _sum: { amount: true },
    });
    const allTimeTotal = Number(allTimeTotalResult._sum.amount ?? 0);

    return {
        merchantTotals,
        currentMonthTotal,
        allTimeTotal,
    };
}
