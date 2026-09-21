/**
 * src/services/parsers/siman.parser.ts
 *
 * Parser para correos de notificación de Credisiman / Almacenes Simán.
 *
 * Formato real del correo (calibrado con correos reales):
 *
 *   su tarjeta *CREDISIMAN VISA GOLD 1784* ha realizado una
 *   * compra * por USD * 15.00 * en * TELEFONICA MMO WEB RECARG... *
 *
 * Remitente: no-reply@simaninternet.net
 */

import {
    BankEmailParser,
    type RawEmail,
    type ParseResult,
} from "./base.parser";

export class SimanParser extends BankEmailParser {
    readonly bankName = "Tarjeta Simán";

    // Remitente real: no-reply@simaninternet.net
    readonly senderPattern = /simaninternet\.net|siman\.com/i;

    protected extract(email: RawEmail): ParseResult {
        const body = email.textBody || email.htmlBody;

        // Ignorar correos de estado de cuenta — solo procesar notificaciones
        if (/estado de cuenta/i.test(email.subject)) {
            return { success: false, reason: "Correo de estado de cuenta — omitido" };
        }

        // ── Monto ─────────────────────────────────────────────────────
        // Formato real: "por USD * 15.00 *"
        // Los asteriscos son parte del formato de texto del correo
        const amountMatch = body.match(
            /por\s+USD\s*\*?\s*([\d,]+\.?\d{0,2})\s*\*/i
        );

        if (!amountMatch?.[1]) {
            return { success: false, reason: "No se pudo extraer el monto" };
        }

        const amount = this.parseAmount(amountMatch[1]);
        if (!amount || amount <= 0) {
            return { success: false, reason: `Monto inválido: ${amountMatch[1]}` };
        }

        // ── Comercio ──────────────────────────────────────────────────
        // Formato real: "en * TELEFONICA MMO WEB RECARGSAN SALVADOR SV.*"
        const merchantMatch = body.match(
            /en\s*\*\s*([^*\n\r]+?)\s*\*/i
        );

        const merchant = merchantMatch?.[1]
            ? this.normalizeMerchant(merchantMatch[1])
            : "Comercio desconocido";

        // ── Últimos 4 dígitos ─────────────────────────────────────────
        // Formato real: "CREDISIMAN VISA GOLD 1784"
        const lastFourMatch = body.match(
            /CREDISIMAN\s+(?:VISA|MASTERCARD|AMEX)\s+\w+\s+(\d{4})/i
        );

        // ── Tipo de tarjeta ───────────────────────────────────────────
        const cardType = /\bVISA\b/i.test(body)
            ? "VISA"
            : /MASTERCARD/i.test(body)
                ? "MASTERCARD"
                : "UNKNOWN";

        // ── Fecha ─────────────────────────────────────────────────────
        // El correo de Simán no incluye fecha de transacción en el cuerpo,
        // usamos la fecha de recepción del correo como aproximación.
        const transactedAt = email.receivedAt;

        return {
            success: true,
            transaction: {
                emailMessageId: email.messageId,
                amount,
                merchant,
                transactedAt,
                bankName: this.bankName,
                cardType,
                lastFour: lastFourMatch?.[1],
                category: this.inferCategory(merchant),
                rawEmailBody: body,
            },
        };
    }
}