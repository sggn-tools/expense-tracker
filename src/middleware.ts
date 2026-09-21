/**
 * src/middleware.ts
 * Middleware de autenticación que protege rutas del dashboard.
 *
 * Se ejecuta en el Edge Runtime ANTES de que Next.js renderice
 * cualquier página o ejecute cualquier API route. Si no hay sesión
 * válida, redirige a /login inmediatamente.
 *
 * IMPORTANTE: Importa auth.config.ts (ligero, sin Prisma/bcrypt)
 * en lugar de auth.ts para mantenerse bajo el límite de 1 MB
 * de Vercel Edge Functions.
 */
import NextAuth from "next-auth";
import authConfig from "@/lib/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

// Rutas que requieren autenticación
const PROTECTED_ROUTES = ["/dashboard"];

// Rutas accesibles sólo sin sesión (redirigen al dashboard si ya hay sesión)
const AUTH_ROUTES = ["/login", "/register"];

export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  // Si está autenticado e intenta acceder a login → redirigir al dashboard
  if (isAuthenticated && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Si no está autenticado e intenta acceder a ruta protegida → redirigir a login
  if (!isAuthenticated && PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
    const loginUrl = new URL("/login", req.url);
    // Guardar la URL intentada para redirigir después del login
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

// Configurar qué rutas activan el middleware.
// El matcher excluye assets estáticos y rutas de Next.js internos.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

