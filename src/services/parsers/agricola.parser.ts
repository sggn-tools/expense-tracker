/**
 * src/services/parsers/agricola.parser.ts
 *
 * Parser para correos de Banco Agrícola El Salvador.
 *
 * Formato real del correo (solo HTML, sin texto plano):
 *
 *   su tarjeta de crédito 2459 ha realizado una COMPRA
 *   por USD 69.11 en WOMPI Antiguo CuscaSV.
 *   Fecha/Hora: 07/05/2026 13:16:30
 *
 * Remitente: canalesdigitales@notificacionesbancoagricola.com
 */

import {
    BankEmailParser,
    type RawEmail,
    type ParseResult,
} from "./base.parser";

export class BancoAgricolaParser extends BankEmailParser {
    readonly bankName = "Banco Agrícola";

    readonly senderPattern = /notificacionesbancoagricola\.com/i;

    protected extract(email: RawEmail): ParseResult {
        // Banco Agrícola envía solo HTML — convertir a texto plano
        const body = email.textBody || this.stripHtml(email.htmlBody);

        if (!body) {
            return { success: false, reason: "Correo sin contenido" };
        }

        // ── Monto ─────────────────────────────────────────────────────
        // Formato 1: "ha realizado una COMPRA por USD 69.11 en"
        // Formato 2: "Monto: $ 4.30"
        let amountMatch = body.match(
            /COMPRA\s+por\s+USD\s+([\d,]+\.?\d{0,2})\s+en/i
        );
        if (!amountMatch) {
            amountMatch = body.match(/Monto:\s*\$\s*([\d,]+\.?\d{0,2})/i);
        }

        if (!amountMatch?.[1]) {
            return { success: false, reason: "No se pudo extraer el monto" };
        }

        const amount = this.parseAmount(amountMatch[1]);
        if (!amount || amount <= 0) {
            return { success: false, reason: `Monto inválido: ${amountMatch[1]}` };
        }

        // ── Comercio ──────────────────────────────────────────────────
        // Formato 1: "por USD 69.11 en WOMPI                    Antiguo CuscaSV."
        // Formato 2: "Servicio: ANDA Monto: $ 4.30"
        let merchantStr = "Comercio desconocido";
        const merchantMatch = body.match(
            /COMPRA\s+por\s+USD\s+[\d.]+\s+en\s+([^\n\r.]{3,80})/i
        );
        if (merchantMatch?.[1]) {
            merchantStr = merchantMatch[1];
        } else {
            const servicioMatch = body.match(/Servicio:\s*(.+?)\s*Monto:/i);
            if (servicioMatch?.[1]) {
                merchantStr = servicioMatch[1];
            }
        }

        const merchant = this.normalizeMerchant(merchantStr);

        // ── Fecha ─────────────────────────────────────────────────────
        // Formato real: "Fecha/Hora: 07/05/2026 13:16:30"
        const dateMatch = body.match(
            /Fecha\/Hora[:\s]+(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2}:\d{2})/i
        );

        let transactedAt: Date;
        if (dateMatch?.[1] && dateMatch?.[2]) {
            // Convertir DD/MM/YYYY HH:mm:ss → Date
            const [day, month, year] = dateMatch[1].split("/");
            transactedAt = new Date(
                `${year}-${month}-${day}T${dateMatch[2]}-06:00` // UTC-6 El Salvador
            );
            if (isNaN(transactedAt.getTime())) {
                transactedAt = email.receivedAt;
            }
        } else {
            transactedAt = email.receivedAt;
        }

        // ── Últimos 4 dígitos ─────────────────────────────────────────
        // Formato real: "su tarjeta de crédito  2459 ha realizado"
        const lastFourMatch = body.match(
            /tarjeta\s+de\s+cr[eé]dito\s+(\d{4})\s+ha\s+realizado/i
        );

        return {
            success: true,
            transaction: {
                emailMessageId: email.messageId,
                amount,
                merchant,
                transactedAt,
                bankName: this.bankName,
                cardType: "VISA", // Banco Agrícola TDC es principalmente Visa
                lastFour: lastFourMatch?.[1],
                category: this.inferCategory(merchant),
                rawEmailBody: body,
            },
        };
    }

    /**
     * Convierte HTML a texto plano eliminando tags y decodificando
     * entidades HTML comunes (el correo usa iso-8859-1).
     */
    private stripHtml(html: string): string {
        return html
            // Reemplazar saltos de línea HTML por espacios
            .replace(/<br\s*\/?>/gi, " ")
            .replace(/<\/p>/gi, " ")
            // Eliminar todos los tags restantes
            .replace(/<[^>]+>/g, "")
            // Decodificar entidades HTML frecuentes
            .replace(/&eacute;/g, "é")
            .replace(/&aacute;/g, "á")
            .replace(/&iacute;/g, "í")
            .replace(/&oacute;/g, "ó")
            .replace(/&uacute;/g, "ú")
            .replace(/&ntilde;/g, "ñ")
            .replace(/&amp;/g, "&")
            .replace(/&nbsp;/g, " ")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            // Colapsar espacios múltiples en uno
            .replace(/\s+/g, " ")
            .trim();
    }
}