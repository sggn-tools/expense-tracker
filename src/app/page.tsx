/**
 * src/app/page.tsx
 * Ruta raíz — redirige al dashboard.
 * El middleware se encarga de redirigir a /login si no hay sesión.
 */
import { redirect } from "next/navigation";

export default function RootPage() {
    redirect("/dashboard");
}