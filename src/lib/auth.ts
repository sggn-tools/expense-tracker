/**
 * src/lib/auth.ts
 * Configuración COMPLETA de NextAuth.js v5 — solo para Node.js Runtime.
 *
 * Extiende la configuración base de auth.config.ts (compatible con Edge)
 * añadiendo PrismaAdapter + CredentialsProvider + bcrypt.
 *
 * Este archivo es importado por:
 *   - API routes (handlers)
 *   - Server Components (auth())
 *   - Server Actions (signIn / signOut)
 *
 * El middleware.ts NO debe importar este archivo; usa auth.config.ts.
 */
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/schemas/auth";
import authConfig from "@/lib/auth.config";

// Exportar handlers, auth helper y helpers de login/logout
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  // ── Adapter (solo Node.js) ─────────────
  adapter: PrismaAdapter(prisma),

  // ── Providers (solo Node.js) ───────────
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        // 1. Validar con Zod antes de tocar la BD
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // 2. Buscar usuario en BD
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, name: true, passwordHash: true },
        });

        if (!user) return null;

        // 3. Verificar contraseña con bcrypt
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        // 4. Retornar objeto sin passwordHash
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
});

