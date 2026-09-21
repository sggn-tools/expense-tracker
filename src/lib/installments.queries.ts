/**
 * src/lib/installments.queries.ts
 *
 * Queries Prisma para compras a plazo y sus pagos.
 * Todas las funciones validan el userId para seguridad.
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { type CreateInstallmentInput } from "@/schemas/installment";

/**
 * Obtiene todas las compras a plazo del usuario con sus pagos y tarjeta.
 */
export async function getInstallments(userId: string) {
  return prisma.installmentPurchase.findMany({
    where: {
      card: {
        userId,
      },
    },
    include: {
      card: {
        select: {
          id: true,
          bankName: true,
          cardType: true,
          lastFour: true,
          alias: true,
        },
      },
      payments: {
        orderBy: {
          monthNumber: "asc",
        },
      },
    },
    orderBy: {
      purchasedAt: "desc",
    },
  });
}

/**
 * Obtiene el detalle de una compra a plazo específica.
 */
export async function getInstallmentDetail(id: string, userId: string) {
  return prisma.installmentPurchase.findFirst({
    where: {
      id,
      card: {
        userId,
      },
    },
    include: {
      card: {
        select: {
          id: true,
          bankName: true,
          cardType: true,
          lastFour: true,
          alias: true,
        },
      },
      payments: {
        orderBy: {
          monthNumber: "asc",
        },
      },
    },
  });
}

/**
 * Registra una compra a plazo y genera sus cuotas fijas correspondientes.
 */
export async function createInstallment(userId: string, data: CreateInstallmentInput) {
  // Verificar propiedad de la tarjeta
  const card = await prisma.card.findFirst({
    where: {
      id: data.cardId,
      userId,
    },
  });

  if (!card) {
    throw new Error("La tarjeta especificada no existe o no pertenece a este usuario.");
  }

  const totalAmount = new Prisma.Decimal(data.totalAmount);
  const totalMonths = data.totalMonths;

  // Cálculo de cuotas fijas. Redondeamos a 2 decimales.
  // La última cuota absorbe el residuo para que la suma sea exactamente el totalAmount.
  const baseAmount = Number((Number(data.totalAmount) / totalMonths).toFixed(2));
  const baseAmountDecimal = new Prisma.Decimal(baseAmount);
  const sumOfBasePayments = baseAmountDecimal.mul(totalMonths - 1);
  const lastAmount = totalAmount.sub(sumOfBasePayments);

  return prisma.$transaction(async (tx) => {
    const purchase = await tx.installmentPurchase.create({
      data: {
        cardId: data.cardId,
        merchant: data.merchant,
        totalAmount: totalAmount,
        totalMonths: totalMonths,
        purchasedAt: data.purchasedAt,
        firstPaymentAt: data.firstPaymentAt,
        notes: data.notes,
        status: "ACTIVE",
      },
    });

    const paymentsData = [];
    for (let i = 1; i <= totalMonths; i++) {
      const isLast = i === totalMonths;
      const paymentAmount = isLast ? lastAmount : baseAmountDecimal;

      // Calcular fecha de vencimiento: primer pago + (i - 1) meses en UTC
      const dueDate = new Date(data.firstPaymentAt);
      dueDate.setUTCMonth(dueDate.getUTCMonth() + (i - 1));

      paymentsData.push({
        purchaseId: purchase.id,
        monthNumber: i,
        dueDate,
        amount: paymentAmount,
        isPaid: false,
      });
    }

    await tx.installmentPayment.createMany({
      data: paymentsData,
    });

    return tx.installmentPurchase.findUnique({
      where: { id: purchase.id },
      include: {
        card: true,
        payments: {
          orderBy: {
            monthNumber: "asc",
          },
        },
      },
    });
  });
}

/**
 * Marca una cuota como pagada y actualiza el estado de la compra principal a COMPLETED si corresponde.
 */
export async function markPaymentPaid(paymentId: string, userId: string) {
  const payment = await prisma.installmentPayment.findFirst({
    where: {
      id: paymentId,
      purchase: {
        card: {
          userId,
        },
      },
    },
    include: {
      purchase: true,
    },
  });

  if (!payment) {
    throw new Error("El pago especificado no existe o no pertenece a este usuario.");
  }

  if (payment.isPaid) {
    throw new Error("Este pago ya ha sido realizado.");
  }

  return prisma.$transaction(async (tx) => {
    // Actualizar pago
    const updatedPayment = await tx.installmentPayment.update({
      where: { id: paymentId },
      data: {
        isPaid: true,
        paidAt: new Date(),
      },
    });

    // Obtener todos los pagos restantes para ver si se completaron
    const allPayments = await tx.installmentPayment.findMany({
      where: { purchaseId: payment.purchaseId },
    });

    // Validar si todos están pagados (incluyendo el actual que acabamos de actualizar en base de datos)
    // Nota: findMany arriba traerá el estado actualizado si lo hacemos dentro de la misma transacción y después del update.
    const allPaid = allPayments.every((p) => p.isPaid);

    if (allPaid) {
      await tx.installmentPurchase.update({
        where: { id: payment.purchaseId },
        data: {
          status: "COMPLETED",
        },
      });
    }

    return updatedPayment;
  });
}
