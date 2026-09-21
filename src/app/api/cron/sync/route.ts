/**
 * src/app/api/cron/sync/route.ts
 *
 * Endpoint invocado automáticamente por el scheduler.
 * Protegido por CRON_SECRET — no requiere sesión de usuario.
 *
 * Compatible con:
 *   - Vercel Cron Jobs (vercel.json)
 *   - Railway cron
 *   - Crontab del servidor (curl)
 *   - Cualquier scheduler que soporte HTTP
 *
 * Ejemplo de invocación manual:
 *   curl -X GET http://localhost:3000/api/cron/sync \
 *     -H "Authorization: Bearer tu_cron_secret"
 */

import { NextResponse } from "next/server";
import { validateCronSecret, getSystemUserId } from "@/lib/cron.config";
import { runIngestion } from "@/services/ingestion.service";

export async function GET(request: Request) {
    // 1. Validar el secret antes de hacer cualquier otra cosa
    if (!validateCronSecret(request)) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 2. Obtener el userId para la sincronización
    const userId = await getSystemUserId();
    if (!userId) {
        return NextResponse.json(
            { error: "No hay usuarios configurados en el sistema" },
            { status: 404 }
        );
    }

    // 3. Ejecutar ingesta
    const startedAt = new Date();

    try {
        const summary = await runIngestion(userId);
        const duration = Date.now() - startedAt.getTime();

        console.log(`[Cron] Sync completado en ${duration}ms`, summary);

        return NextResponse.json({
            ok: true,
            duration: `${duration}ms`,
            summary,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Error desconocido";
        console.error("[Cron] Error en sync:", message);

        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}