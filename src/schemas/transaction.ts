/**
 * src/schemas/transaction.ts
 * Esquemas Zod para validación de transacciones y filtros del dashboard.
 */
import { z } from "zod";

export const transactionSchema = z.object({
  cardId: z.string().cuid(),
  emailMessageId: z.string().min(1, "Message-ID requerido"),
  amount: z.number().positive("El monto debe ser positivo"),
  currency: z.string().length(3).default("USD"),
  merchant: z.string().min(1).max(200),
  category: z.string().max(100).optional(),
  transactedAt: z.coerce.date(),
  rawEmailBody: z.string().optional(),
});

// Filtros del dashboard (todos opcionales)
export const dashboardFiltersSchema = z.object({
  year: z.coerce.number().int().min(2020).max(2099).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  day: z.coerce.number().int().min(1).max(31).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  cardId: z.string().cuid().optional(),
  bankName: z.string().optional(),
  /** Pestaña activa: "current" = mes actual, "all" = consolidado */
  tab: z.enum(["current", "all"]).optional(),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
export type DashboardFilters = z.infer<typeof dashboardFiltersSchema>;
