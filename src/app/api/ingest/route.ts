/**
 * src/app/api/ingest/route.ts
 *
 * Endpoint protegido para disparar la ingesta de correos manualmente.
 * Solo accesible para usuarios autenticados.
 *
 * POST /api/ingest
 * → { summary: IngestionSummary }
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runIngestion } from "@/services/ingestion.service";
// Debug temporal — remover después de calibrar
import { fetchEmailsViaImap, imapConfigFromEnv } from "@/services/email/imap.client";

export async function POST() {
    // Verificar sesión — doble capa además del middleware
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const summary = await runIngestion(session.user.id);

        return NextResponse.json({ summary }, { status: 200 });
    } catch (err) {
        const message =
            err instanceof Error ? err.message : "Error interno del servidor";
        console.error("[POST /api/ingest] Error:", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}


/*export async function GET() {
    const emails = await fetchEmailsViaImap(imapConfigFromEnv());
    const bancarios = emails.filter(e =>
        /bancoagricola|siman/i.test(e.from)
    );
    return NextResponse.json(bancarios.map(e => ({
        from: e.from,
        subject: e.subject,
        hasText: e.textBody.length > 0,
        hasHtml: e.htmlBody.length > 0,
        // Mostrar texto si existe, si no los primeros 1000 chars del HTML
        body: e.textBody
            ? e.textBody.slice(0, 1000)
            : e.htmlBody.slice(0, 1000),
    })));
}*/

// Solo aceptar POST
export async function GET() {
    return NextResponse.json(
        { error: "Método no permitido. Usa POST." },
        { status: 405 }
    );
}