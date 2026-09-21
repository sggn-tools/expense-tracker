/**
 * src/lib/auth.ts
 * Configuración central de NextAuth.js v5.
 *
 * Estrategia: JWT almacenado EXCLUSIVAMENTE en HttpOnly cookies.
 * Nunca se expone el token a JavaScript del cliente (sin localStorage).
 * La sesión se valida server-side en cada request via auth().
 */
import NextAuth, { type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/schemas/auth";

const config: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),

  // ── Estrategia JWT ─────────────────────
  // "jwt" no usa la tabla sessions en BD;
  // la sesión vive en la cookie cifrada.
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },

  // ── Cookie segura (HttpOnly, Secure, SameSite) ──
  // Next-Auth gestiona esto automáticamente en producción.
  // En desarrollo (http://localhost) no se puede usar Secure=true,
  // pero HttpOnly y SameSite=lax sí aplican.
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,                          // ← CLAVE: inaccesible desde JS
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  // ── Providers ─────────────────────────
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

// Exportar handlers, auth helper y helpers de login/logout
export const { handlers, auth, signIn, signOut } = NextAuth(config);
