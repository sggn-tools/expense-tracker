/**
 * src/lib/prisma.ts
 * Singleton del cliente Prisma para Next.js.
 *
 * En desarrollo, Next.js recarga módulos en cada hot-reload,
 * lo que crea múltiples instancias de PrismaClient y agota
 * el pool de conexiones. Este patrón lo previene usando
 * una variable global que persiste entre recargas.
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
