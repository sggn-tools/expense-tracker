/**
 * src/services/ingestion.service.ts
 *
 * Orquestador principal del flujo de ingesta.
 * Coordina: IMAP → Parsers → Base de datos.
 *
 * El orquestador no sabe nada de bancos específicos —
 * delega todo el parsing al registry y solo se preocupa
 * por persistir el resultado correctamente.
 */

import { prisma } from "@/lib/prisma";
import { fetchEmailsViaImap, imapConfigFromEnv } from "./email/imap.client";
import { PARSER_REGISTRY } from "./parsers/parser.registry";
import type { ParsedTransaction, RawEmail } from "./parsers/base.parser";

// ── Tipos de resultado ────────────────────────────────────────────

export interface IngestionSummary {
    totalFetched: number;
    parsed: number;
    saved: number;
    duplicates: number;
    errors: IngestionError[];
}

interface IngestionError {
    emailMessageId?: string;
    message: string;
}

// ── Servicio principal ────────────────────────────────────────────

/**
 * Ejecuta el flujo completo de ingesta:
 * 1. Descarga correos via IMAP
 * 2. Intenta parsear cada correo con los parsers registrados
 * 3. Persiste las transacciones nuevas (upsert para idempotencia)
 * 4. Retorna un resumen del proceso
 */
export async function runIngestion(userId: string): Promise<IngestionSummary> {
    const summary: IngestionSummary = {
        totalFetched: 0,
        parsed: 0,
        saved: 0,
        duplicates: 0,
        errors: [],
    };

    // 1. Descargar correos via IMAP
    let emails: RawEmail[] = [];
    try {
        const config = imapConfigFromEnv();
        emails = await fetchEmailsViaImap(config);
        summary.totalFetched = emails.length;
    } catch (err) {
        const message = err instanceof Error ? err.message : "Error IMAP desconocido";
        console.error("[Ingestion] Error conectando a IMAP:", message);
        summary.errors.push({ message });
        return summary;
    }

    // 2. Parsear cada correo
    const transactions: ParsedTransaction[] = [];

    for (const email of emails) {
        let matched = false;

        for (const parser of PARSER_REGISTRY) {
            const result = parser.parse(email);

            if (result.success) {
                transactions.push(result.transaction);
                matched = true;
                summary.parsed++;
                break; // Un correo → un parser, no seguir iterando
            }
        }

        if (!matched) {
            console.debug(
                `[Ingestion] Correo no coincide con ningún parser: ${email.from} — "${email.subject}"`
            );
        }
    }

    // 3. Persistir transacciones
    for (const tx of transactions) {
        try {
            await persistTransaction(tx, userId);
            summary.saved++;
        } catch (err) {
            // Si es error de duplicado de Prisma (P2002), contarlo aparte
            if (isPrismaUniqueError(err)) {
                summary.duplicates++;
                console.debug(
                    `[Ingestion] Duplicado ignorado: ${tx.emailMessageId}`
                );
            } else {
                const message =
                    err instanceof Error ? err.message : "Error de persistencia";
                console.error(`[Ingestion] Error guardando ${tx.emailMessageId}:`, message);
                summary.errors.push({ emailMessageId: tx.emailMessageId, message });
            }
        }
    }

    console.log(
        `[Ingestion] Completado — ` +
        `fetched: ${summary.totalFetched}, ` +
        `parsed: ${summary.parsed}, ` +
        `saved: ${summary.saved}, ` +
        `duplicates: ${summary.duplicates}, ` +
        `errors: ${summary.errors.length}`
    );

    return summary;
}

// ── Helpers privados ──────────────────────────────────────────────

/**
 * Persiste una transacción parseada en la BD.
 *
 * Flujo:
 *  1. Busca la tarjeta del usuario que coincida con bankName + lastFour
 *  2. Si no existe, la crea automáticamente
 *  3. Hace upsert de la transacción usando emailMessageId como clave única
 */
async function persistTransaction(
    tx: ParsedTransaction,
    userId: string
): Promise<void> {
    // Buscar o crear la tarjeta correspondiente
    const card = await findOrCreateCard(tx, userId);

    // Upsert: si el emailMessageId ya existe, actualiza; si no, crea
    await prisma.transaction.upsert({
        where: { emailMessageId: tx.emailMessageId },
        update: {
            amount: tx.amount,
            merchant: tx.merchant,
            category: tx.category,
            transactedAt: tx.transactedAt,
            rawEmailBody: tx.rawEmailBody,
        },
        create: {
            emailMessageId: tx.emailMessageId,
            cardId: card.id,
            amount: tx.amount,
            merchant: tx.merchant,
            category: tx.category,
            transactedAt: tx.transactedAt,
            rawEmailBody: tx.rawEmailBody,
        },
    });
}

/**
 * Busca la tarjeta del usuario que coincida con bankName + lastFour.
 * Si no existe (primera vez que se ve esa tarjeta), la crea.
 */
async function findOrCreateCard(
    tx: ParsedTransaction,
    userId: string
) {
    // Si el correo incluye los últimos 4 dígitos, usarlos para match exacto
    if (tx.lastFour) {
        return prisma.card.upsert({
            where: {
                userId_bankName_lastFour: {
                    userId,
                    bankName: tx.bankName,
                    lastFour: tx.lastFour,
                },
            },
            update: {},
            create: {
                userId,
                bankName: tx.bankName,
                cardType: tx.cardType,
                lastFour: tx.lastFour,
                alias: `${tx.cardType} ${tx.bankName}`,
            },
        });
    }

    // Sin lastFour: buscar cualquier tarjeta activa de ese banco para el usuario
    const existing = await prisma.card.findFirst({
        where: { userId, bankName: tx.bankName, isActive: true },
    });

    if (existing) return existing;

    // Crear tarjeta genérica si no existe ninguna
    return prisma.card.create({
        data: {
            userId,
            bankName: tx.bankName,
            cardType: tx.cardType,
            lastFour: "0000",
            alias: `${tx.cardType} ${tx.bankName}`,
        },
    });
}

function isPrismaUniqueError(err: unknown): boolean {
    return (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: string }).code === "P2002"
    );
}