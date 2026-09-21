/**
 * src/middleware.ts
 * Middleware NATIVO (Zero-Dependencies)
 *
 * Se ejecuta en el Edge Runtime ANTES de que Next.js renderice.
 * Para evadir el límite de 1MB de Vercel (Edge Functions), este
 * middleware NO importa "next-auth" en absoluto. Solamente
 * lee la presencia de la cookie JWT nativamente.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rutas que requieren autenticación
const PROTECTED_ROUTES = ["/dashboard"];

// Rutas accesibles sólo sin sesión (redirigen al dashboard si ya hay sesión)
const AUTH_ROUTES = ["/login", "/register"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Verificamos si existe la cookie de sesión de Auth.js
  // Se revisan todas las cookies por si está particionada o usa el prefijo seguro __Secure-
  const isAuthenticated = req.cookies.getAll().some(
    (cookie) =>
      cookie.name.includes("next-auth.session-token") ||
      cookie.name.includes("__Secure-next-auth.session-token")
  );

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
}

// Configurar qué rutas activan el middleware.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
