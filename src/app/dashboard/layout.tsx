/**
 * src/app/dashboard/layout.tsx
 * Layout del área autenticada.
 * Incluye Header con info del usuario y botón de Logout,
 * y Footer. Al cerrar sesión: limpia cookie, invalida sesión
 * y redirige a /login.
 */
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CreditCard, LogOut, BarChart3, PieChart, CalendarClock, Fuel } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Validación server-side: si no hay sesión, redirigir
  // (el middleware ya lo haría, pero esta es la segunda capa de defensa)
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-semibold text-gray-900 hover:text-gray-700 transition-colors"
            >
              <CreditCard className="h-5 w-5 text-blue-600" />
              <span>Expense Tracker</span>
            </Link>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/dashboard/charts"
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                <PieChart className="h-4 w-4" />
                Gráficos
              </Link>
              <Link
                href="/dashboard/installments"
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                <CalendarClock className="h-4 w-4" />
                Compras a Plazo
              </Link>
              <Link
                href="/dashboard/gasoline/new"
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                <Fuel className="h-4 w-4" />
                Gasolina
              </Link>
            </nav>

            {/* Usuario + Logout */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 hidden sm:block">
                {session.user.email}
              </span>

              {/* Server Action para logout */}
              <form
                action={async () => {
                  "use server";
                  // signOut limpia la HttpOnly cookie automáticamente
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <button
                  type="submit"
                  className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar sesión</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-xs text-gray-400 text-center">
            Personal Expense Tracker — Datos sincronizados desde correos bancarios
          </p>
        </div>
      </footer>
    </div>
  );
}
