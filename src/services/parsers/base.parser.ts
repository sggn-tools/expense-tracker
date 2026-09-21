/**
 * src/services/parsers/base.parser.ts
 *
 * Clase abstracta base para parsers de correos bancarios.
 * Implementa el patrón Strategy: cada banco es una estrategia
 * concreta que extiende esta clase e implementa su propia
 * lógica de extracción sin tocar el orquestador.
 *
 * Para agregar un nuevo banco:
 *   1. Crear `nuevo-banco.parser.ts` extendiendo BankEmailParser
 *   2. Registrarlo en parser.registry.ts
 *   ¡Listo! — sin modificar ningún otro archivo.
 */

// ── Tipos compartidos ─────────────────────────────────────────────

/** Correo crudo tal como llega desde IMAP */
export interface RawEmail {
    /** Message-ID del header MIME — usado como clave de idempotencia */
    messageId: string;
    /** Dirección del remitente */
    from: string;
    /** Asunto del correo */
    subject: string;
    /** Cuerpo en texto plano */
    textBody: string;
    /** Cuerpo en HTML (puede estar vacío) */
    htmlBody: string;
    /** Fecha de recepción */
    receivedAt: Date;
}

/** Transacción extraída y normalizada de un correo */
export interface ParsedTransaction {
    /** Message-ID original — para deduplicación en BD */
    emailMessageId: string;
    /** Monto en USD */
    amount: number;
    /** Nombre del comercio */
    merchant: string;
    /** Fecha de la transacción (no necesariamente la del correo) */
    transactedAt: Date;
    /** Nombre del banco tal como está en la tabla cards */
    bankName: string;
    /** Tipo de tarjeta detectado */
    cardType: "VISA" | "MASTERCARD" | "AMEX" | "UNKNOWN";
    /** Últimos 4 dígitos de la tarjeta (si el correo los incluye) */
    lastFour?: string;
    /** Categoría inferida del comercio */
    category?: string;
    /** Cuerpo original para auditoría / debug */
    rawEmailBody: string;
}

/** Resultado del intento de parseo */
export type ParseResult =
    | { success: true; transaction: ParsedTransaction }
    | { success: false; reason: string };

// ── Clase abstracta base ──────────────────────────────────────────

export abstract class BankEmailParser {
    /** Nombre del banco — debe coincidir con Card.bankName en la BD */
    abstract readonly bankName: string;

    /** Regex contra el campo "from" del correo para identificar al emisor */
    abstract readonly senderPattern: RegExp;

    /**
     * Punto de entrada principal.
     * Verifica que el correo sea de este banco y delega al parsing.
     */
    parse(email: RawEmail): ParseResult {
        if (!this.senderPattern.test(email.from)) {
            return { success: false, reason: "Sender does not match" };
        }
        return this.extract(email);
    }

    /**
     * Lógica de extracción específica de cada banco.
     * Implementada por cada subclase.
     */
    protected abstract extract(email: RawEmail): ParseResult;

    // ── Helpers compartidos ────────────────────────────────────────

    /**
     * Extrae un monto numérico de un string.
     * Soporta formatos: "$38.50", "USD 1,284.00", "38,50"
     */
    protected parseAmount(raw: string): number | null {
        // Eliminar símbolo de moneda y espacios
        const cleaned = raw.replace(/[USD$€\s]/gi, "").trim();

        // Formato centroamericano: coma como separador de miles → "1,284.50"
        const normalized = cleaned.replace(/,(?=\d{3})/g, "");

        const value = parseFloat(normalized);
        return isNaN(value) ? null : value;
    }

    /**
     * Normaliza el texto de un comercio.
     * Elimina códigos internos, extra spaces y caracteres raros.
     */
    protected normalizeMerchant(raw: string): string {
        return raw
            .replace(/\s+/g, " ")
            .replace(/[*#]/g, "")
            .trim()
            .replace(/\b\w/g, (c) => c.toUpperCase()); // Title Case
    }

    /**
     * Infiere una categoría básica basándose en palabras clave del comercio.
     * Puede extenderse con un catálogo más completo por banco.
     */
    protected inferCategory(merchant: string): string {
        const m = merchant.toLowerCase();

        if (/super|selectos|walmart|la despensa|costo|pricesmart/.test(m))
            return "Supermercado";
        if (/shell|texaco|uno gas|puma|gasolinera|gasolina|combustible/.test(m))
            return "Gasolina";
        if (/restaurante|pizza|burger|pollo|comida|café|coffee|sushi|diner/.test(m))
            return "Restaurante";
        if (/netflix|spotify|amazon|google|apple|youtube|disney/.test(m))
            return "Suscripción";
        if (/farmacia|doctor|hospital|clínica|medic|salud/.test(m))
            return "Salud";
        if (/uber|cabify|taxi|lyft/.test(m))
            return "Transporte";
        if (/hotel|airbnb|hostal/.test(m))
            return "Hospedaje";
        if (/siman|zara|h&m|ropa|moda|fashion/.test(m))
            return "Ropa";

        return "Otro";
    }
}