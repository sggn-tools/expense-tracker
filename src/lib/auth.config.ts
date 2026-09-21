/**
 * src/lib/auth.config.ts
 *
 * Configuración BASE de NextAuth.js v5 — SOLO lo compatible con Edge Runtime.
 *
 * Este archivo NO importa Prisma, bcrypt ni ningún módulo pesado de Node.js.
 * El middleware.ts importa únicamente este archivo para mantenerse por debajo
 * del límite de 1 MB de Vercel Edge Functions.
 *
 * La configuración completa (con PrismaAdapter + CredentialsProvider) vive
 * en auth.ts, que extiende esta config para el entorno de servidor (Node.js).
 */
import type { NextAuthConfig } from "next-auth";

const authConfig: NextAuthConfig = {
  // ── Estrategia JWT ─────────────────────
  // "jwt" no usa la tabla sessions en BD;
  // la sesión vive en la cookie cifrada.
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },

  // ── Cookie segura (HttpOnly, Secure, SameSite) ──
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  // ── Providers ──────────────────────────
  // Vacío aquí; auth.ts inyecta CredentialsProvider con Prisma + bcrypt.
  providers: [],

  // ── Callbacks ─────────────────────────
  callbacks: {
    // Agrega el userId al token JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    // Expone el userId en el objeto session del cliente
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  // ── Páginas personalizadas ─────────────
  pages: {
    signIn: "/login",
    error: "/login",
  },
};

export default authConfig;
