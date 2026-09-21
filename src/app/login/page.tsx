/**
 * src/app/login/page.tsx
 * Página de inicio de sesión.
 * Server Component con Client Component para el formulario interactivo.
 */
import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  // Si ya hay sesión, redirigir al dashboard
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  const { callbackUrl, error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-4">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Expense Tracker
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Inicia sesión para ver tus gastos
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                {error === "CredentialsSignin"
                  ? "Email o contraseña incorrectos"
                  : "Ocurrió un error. Intenta de nuevo."}
              </p>
            </div>
          )}
          <LoginForm callbackUrl={callbackUrl ?? "/dashboard"} />
        </div>

        <p className="text-xs text-center text-gray-400 mt-6">
          Sesión protegida con JWT y HttpOnly cookies
        </p>
      </div>
    </div>
  );
}
