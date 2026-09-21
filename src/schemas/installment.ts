/**
 * src/schemas/installment.ts
 * Esquemas Zod para la validación de compras a plazo y pagos.
 */
import { z } from "zod";

export const createInstallmentSchema = z.object({
  cardId: z.string().cuid("ID de tarjeta no válido"),
  merchant: z.string().min(1, "El comercio es requerido").max(200, "El nombre del comercio es demasiado largo"),
  totalAmount: z.coerce.number().positive("El monto total debe ser positivo"),
  totalMonths: z.coerce.number().int().min(2, "El número de meses mínimo es 2").max(60, "El número de meses máximo es 60"),
  purchasedAt: z.coerce.date(),
  firstPaymentAt: z.coerce.date(),
  notes: z.string().max(500, "La nota es demasiado larga").optional().nullable(),
});

export type CreateInstallmentInput = z.infer<typeof createInstallmentSchema>;
