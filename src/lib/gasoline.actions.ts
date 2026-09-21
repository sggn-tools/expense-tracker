"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { GASOLINE_MERCHANTS } from "./gasoline.queries";

const gasolineSchema = z.object({
    amount: z.coerce.number().positive({ message: "El monto debe ser mayor a 0" }),
    merchant: z.enum(GASOLINE_MERCHANTS, {
        errorMap: () => ({ message: "Comercio no válido" }),
    }),
    paymentType: z.enum(["Credito", "Contado"], {
        errorMap: () => ({ message: "Tipo de pago no válido" }),
    }),
    purchasedAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Fecha no válida",
    }),
});

export async function addGasolinePurchase(prevState: any, formData: FormData) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: "No autorizado" };
        }

        const rawData = {
            amount: formData.get("amount"),
            merchant: formData.get("merchant"),
            paymentType: formData.get("paymentType"),
            purchasedAt: formData.get("purchasedAt"),
        };

        const validated = gasolineSchema.safeParse(rawData);
        if (!validated.success) {
            return { error: validated.error.errors[0]?.message || "Error de validación" };
        }

        const { amount, merchant, paymentType, purchasedAt } = validated.data;

        await prisma.gasolinePurchase.create({
            data: {
                userId: session.user.id,
                amount,
                merchant,
                paymentType,
                // Parse date assuming local timezone from the form input "YYYY-MM-DD"
                purchasedAt: new Date(`${purchasedAt}T12:00:00Z`),
            },
        });

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error al guardar compra de gasolina:", error);
        return { error: "Error interno del servidor" };
    }
}
