/**
 * src/app/api/auth/[...nextauth]/route.ts
 * Handler de NextAuth para las rutas /api/auth/*
 * (signin, signout, session, csrf, etc.)
 */
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
