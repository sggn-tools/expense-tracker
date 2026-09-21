/**
 * src/services/email/imap.client.ts
 *
 * Cliente IMAP usando imapflow.
 * Se conecta al buzón, busca correos no leídos de los últimos
 * N días y los retorna como RawEmail para que los parsers los procesen.
 */

import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import type { RawEmail } from "@/services/parsers/base.parser";

interface ImapConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    mailbox?: string;
    /** Cuántos días hacia atrás buscar. Default: 7 */
    lookbackDays?: number;
}

/**
 * Conecta al servidor IMAP, descarga correos recientes
 * y los retorna como RawEmail[].
 *
 * Los correos se marcan como "vistos" al ser descargados
 * para evitar reprocesarlos. La deduplicación real ocurre
 * en BD via emailMessageId, pero esto reduce carga IMAP.
 */
export async function fetchEmailsViaImap(
    config: ImapConfig
): Promise<RawEmail[]> {
    const client = new ImapFlow({
        host: config.host,
        port: config.port,
        secure: config.port === 993,
        auth: {
            user: config.user,
            pass: config.password,
        },
        // Silenciar logs internos de imapflow en producción
        logger: process.env.NODE_ENV === "development" ? undefined : false,
    });

    const emails: RawEmail[] = [];

    try {
        await client.connect();

        const mailbox = config.mailbox ?? "INBOX";
        await client.mailboxOpen(mailbox);

        // Calcular fecha de búsqueda (N días atrás)
        const since = new Date();
        since.setDate(since.getDate() - (config.lookbackDays ?? 7));

        // Buscar mensajes desde la fecha indicada
        // imapflow usa criteria compatible con IMAP SEARCH
        const messages = client.fetch(
            { since },
            { envelope: true, source: true }
        );

        for await (const message of messages) {
            try {
                // Parsear el raw source con mailparser
                const parsed = (await (simpleParser as any)(message.source!)) as any;

                // Extraer Message-ID limpio (sin < >)
                const rawMessageId =
                    parsed.messageId ?? message.envelope?.messageId ?? "";
                const messageId = rawMessageId.replace(/^<|>$/g, "");

                if (!messageId) {
                    console.warn("[IMAP] Correo sin Message-ID, omitiendo");
                    continue;
                }

                emails.push({
                    messageId,
                    from: parsed.from?.text ?? "",
                    subject: parsed.subject ?? "",
                    textBody: parsed.text ?? "",
                    htmlBody:
                        typeof parsed.html === "string" ? parsed.html : "",
                    receivedAt: parsed.date ?? new Date(),
                });
            } catch (parseError) {
                console.error("[IMAP] Error parseando mensaje:", parseError);
                // Continuar con el siguiente mensaje aunque uno falle
            }
        }

        console.log(`[IMAP] ${emails.length} correos descargados desde ${mailbox}`);
    } finally {
        // Siempre cerrar la conexión, incluso si hubo error
        await client.logout();
    }

    return emails;
}

/**
 * Construye la configuración IMAP desde variables de entorno.
 * Lanza un error claro si alguna variable requerida falta.
 */
export function imapConfigFromEnv(): ImapConfig {
    const required = {
        IMAP_HOST: process.env.IMAP_HOST,
        IMAP_USER: process.env.IMAP_USER,
        IMAP_PASSWORD: process.env.IMAP_PASSWORD,
    };

    const missing = Object.entries(required)
        .filter(([, v]) => !v)
        .map(([k]) => k);

    if (missing.length > 0) {
        throw new Error(
            `[IMAP] Variables de entorno faltantes: ${missing.join(", ")}`
        );
    }

    return {
        host: process.env.IMAP_HOST!,
        port: parseInt(process.env.IMAP_PORT ?? "993", 10),
        user: process.env.IMAP_USER!,
        password: process.env.IMAP_PASSWORD!,
        mailbox: process.env.IMAP_MAILBOX ?? "INBOX",
        lookbackDays: parseInt(process.env.IMAP_LOOKBACK_DAYS ?? "7", 10),
    };
}