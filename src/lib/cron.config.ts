/**
 * src/lib/cron.config.ts
 *
 * Configuración centralizada del cron de sincronización.
 *
 * El endpoint del cron NO usa NextAuth (no hay sesión de usuario
 * en una llamada automática). En su lugar, se protege con un
 * CRON_SECRET que solo conoce el servidor que dispara el job.
 */

/**
 * Valida que el header Authorization del request coincida
 * con el CRON_SECRET configurado en variables de entorno.
 *
 * Uso:
 *   const valid = validateCronSecret(request);
 *   if (!valid) return 401;
 */
export function validateCronSecret(request: Request): boolean {
    const secret = process.env.CRON_SECRET;

    if (!secret) {
        console.error("[Cron] CRON_SECRET no está configurado en .env");
        return false;
    }

    // Vercel Cron envía el secret en el header Authorization: Bearer <secret>
    // Un cron externo (crontab, Railway) debe hacer lo mismo
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return false;

    const [scheme, token] = authHeader.split(" ");
    return scheme === "Bearer" && token === secret;
}

/** ID del usuario "sistema" que se usa cuando el cron sincroniza correos.
 *  En una app multi-usuario real, el cron sincronizaría todos los usuarios
 *  con IMAP configurado. Por ahora sincroniza el primer usuario activo.
 */
export async function getSystemUserId(): Promise<string | null> {
    const { prisma } = await import("@/lib/prisma");
    const user = await prisma.user.findFirst({
        select: { id: true },
        orderBy: { createdAt: "asc" },
    });
    return user?.id ?? null;
}